import copy
import itertools
import math
import json
import numpy as np
import pandas as pd
import re
from typing import List, Dict

from server.logger import get_logger
from server.utils import (
    construct_mapper,
    load_json,
    group_by_and_apply_sum,
    combine_dicts_and_sum_values,
)

LOGGER = get_logger(__name__)

TIMELINE_TYPES = ["background", "point", "range"]
SLIDING_WINDOW = 1e7
SNPROF_GROUP_INDEX = (
    5  # TODO: (surajk) This is a hack. Need to make it more generalizable.
)

# Pandas automatically converts to scientific notation when creating new dataframes.
# To avoid this, we set the pandas options to format to float gloablly.
pd.options.display.float_format = "{:.3f}".format


class Timeline:
    def __init__(self, file_path):
        """
        Initializes a Timeline object.

        Encoding : {
            "event_group": {
                "event_names": List, // Required
                "event_type": Str, // Optional: "point" | "range" | "background" - By default, if an event has `start` and `end` timestamp, we will
            }, ... }

        TODO (surajk): Add validation for the `self.rules`.
        """
        self.rules = {
            "runtime": {
                "regex": [
                    "runtime",
                    "FE_(\\w+)",
                    "RT_(\\w+)",
                    "SN_(\\w+)",
                    "SAL_(\\w+)",
                    "BUF_(\\w+)",
                ],
                "event_type": "range",
                "nested_events": "traceEvents",
                # "content": lambda e: "",  # "Tensor ",  # + e["args"]["tensor size"],
                "class_name": "runtime",
            },
            "compile": {
                "regex": ["compile"],
                "event_type": "range",
                # "content": lambda e: " ",
                "class_name": "compile",
            },
            "tracing": {
                "regex": ["tracing"],
                "event_type": "range",
                # "content": lambda e: " ",
                "class_name": "tracing",
            },
            "Epoch": {
                "regex": ["Epoch"],
                "event_type": "background",
                "content": lambda e: "epoch-" + str(e["epoch_id"])
                if e is not None and "epoch_id" in e
                else "",
                "class_name": "epoch",
            },
        }
        self.grp_to_index, self.index_to_grp = construct_mapper(self.rules)

        # Read the profile
        LOGGER.debug(f"Loading {file_path} as a timeline.")
        self.profile = load_json(file_path=file_path)

        # Access the properties from the JSON.
        self.timeline = self.profile["data"]["traceEvents"]
        self.start_ts = self.timeline[0]["ts"]
        self.end_ts = self.timeline[-1]["ts"]

        # Convert the timeline to a pandas.DataFrame
        # We skip args at the moment because of its dtype=JSON, which requires further refactor to convert to a valid column in timeline_df.
        # TODO (surajk): Add `args` to the final timeline_df.
        self.timeline_df = self.to_df(self.timeline, skip_keys=["args"])
        LOGGER.debug(f"Constructed the timeline dataframe with {self.timeline_df.shape[0]} events")

        # Add vis-related fields as columns in the dataframe.
        #   "group": determined by the self.rules
        #   "type": determined by the event type: 'point', 'range', and 'background'.
        self.add_vis_fields()

        # Process the dataframe according to their respective types.
        # Format: { type: pd.DataFrame({Event}) for type in ["point", "background", "range"] }
        self.grp_df_dict = self.construct_timeline_df_dict()

        # Process the sub_group timelines in the events.
        # If a sub_group is not present, there will be an empty dataframe.
        # Format: { grp: pd.DataFrame({Event} for grp in self.rules.keys() }
        self.sub_grp_df_dict = self.construct_subgroup_timeline_df_dict()

    ################### Supporting functions ###################
    @staticmethod
    def match_event_group_and_type(event, rules):
        """
        Utility function to match the events to correspoinding group and vis_type based on the rules object.
        TODO: (surajk) Add documentation to the function.
        """
        group = None
        type = None

        if event["ph"] in ["B", "E"]:
            type = "range"
        elif event["ph"] == "i":
            type = "point"
        else:
            LOGGER.debug(f"Unsupported event type: {event['ph']}")
            return {"group": group, "type": type}

        regex_to_group = {}
        for [grp, rule] in rules.items():
            for reg in rule["regex"]:
                regex_to_group[reg] = grp

        for [regex, grp] in regex_to_group.items():
            if re.search(regex, event["name"]):
                group = grp
                LOGGER.debug(f"Match found: {regex}: {grp}")
                break

        assert group, f"No matching group identified for {event}."

        # If an override is specified in the rules.
        if "event_type" in rules[group]:
            type = rules[group]["event_type"]

        return group, type

    @staticmethod
    def match_start_and_end_events(df) -> List:
        """
        Match the begin and end events from the dataframe.
        TODO: (suraj) Add documentation on the format.
        """
        ret = []
        stack = []
        for idx, [id, row] in enumerate(df.iterrows()):
            if row["ph"] == "B":
                stack.append((idx, row))
            elif row["ph"] == "E" and row["name"] == stack[-1][1]["name"]:
                begin = stack.pop()
                ret.append((row["name"], [begin[0], idx]))

        return ret

    @staticmethod
    def add_rt_setup_and_teardown_events(rt_df, rt_start_time, rt_end_time) -> pd.DataFrame:
        """
        Adds runtime setup and teardown events to the runtime dataframe.
        """
        pid = rt_df["pid"].unique().tolist()[0]
        tid = rt_df["tid"].unique().tolist()[0]
        rt_id = rt_df["rt_id"].unique().tolist()[0]
        className = rt_df["className"].unique().tolist()[0]
        group = rt_df["group"].unique().tolist()[0]

        rt_setup_dict = {
            "name": "RT_SETUP",
            "pid": pid,
            "tid": tid,
            "start": rt_start_time,
            "end": rt_df["start"].min(),
            "rt_id": rt_id,
            "group": group,
            "className": className,
            "dur": rt_df["start"].min() - rt_start_time,
        }

        rt_teardown_dict = {
            "name": "RT_TEARDOWN",
            "pid": pid,
            "tid": tid,
            "start": rt_df["end"].max(),
            "end": rt_end_time,
            "rt_id": rt_id,
            "group": group,
            "className": className,
            "dur": rt_end_time - rt_df["end"].max(),
        }

        rt_setup_df = pd.DataFrame(data=rt_setup_dict, index=[rt_df.shape[0] + 1])
        rt_teardown_df = pd.DataFrame(data=rt_teardown_dict, index=[rt_df.shape[0] + 1])
        return pd.concat([rt_setup_df, rt_teardown_df])

    def get_event_by_id(self, id: int):
        return self.timeline[id]

    def get_event_args(self, idx):
        if "args" not in self.timeline[idx]:
            return json({})

        return self.timeline[idx]["args"]

    ################### Pre-processing functions ###################
    def to_df(self, timeline: json, skip_keys=[]) -> pd.DataFrame:
        keys = timeline[0].keys()
        f_keys = [i for i in keys if i not in skip_keys]
        _df = pd.DataFrame({key: [e[key] for e in timeline] for key in f_keys})

        # NOTE: We lose a bit of precision here because we round to the nearest integer.
        # TODO: Remove this once we make sure the timestamps are double.
        _df["ts"] = _df["ts"].apply(lambda d: int(d))
        return _df

    def add_vis_fields(self) -> None:
        """
        Add the vis fields based on the type of event.
        # TODO: (surajk) Create vis_fields for the "traceEvents" fields inside the args.
        # NOTE: (surajk) We should consider employing builder pattern to add/remove fields on the dataframe.
        """
        for idx, event in self.timeline_df.iterrows():
            # Add "group", "type" fields.
            _group, _type = Timeline.match_event_group_and_type(event, self.rules)
            self.timeline_df.at[idx, "group"] = _group
            self.timeline_df.at[idx, "type"] = _type

            # Add "content" field.
            if "content" in self.rules[_group].keys():
                _event = self.get_event_by_id(event["id"])
                _args = self.get_event_args(_event["id"])
                _content = self.rules[_group]["content"](_args)
            else:
                _content = ""

            self.timeline_df.at[idx, "content"] = _content

    def construct_point_df(
        self, df: pd.DataFrame, column: str = "ph", override: Dict = {}
    ) -> pd.DataFrame:
        """
        Construct the dataframe containing the point-based events.
        """
        assert column in df.columns

        ret = []
        for idx in range(0, df.shape[0]):
            _e = df.iloc[idx].to_dict()
            _e["className"] = (
                self.rules[_e["group"]]["class_name"]
                if "className" not in override
                else override["className"]
            )
            _e["dur"] = 0  # Duration for a point event is 0
            _e["group"] = (
                self.grp_to_index[_e["group"]]
                if "group" not in override
                else override["group"]
            )
            _e["start"] = _e["ts"]

            del _e["ts"]
            ret.append(_e)

        return pd.DataFrame(ret)

    def construct_range_df(
        self, df: pd.DataFrame, column: str = "ph", override: Dict = {}
    ) -> pd.DataFrame:
        """
        Construct the dataframe containing the range-based events.
        """
        assert column in df.columns

        ret = []
        indexes = Timeline.match_start_and_end_events(df)
        for index in indexes:
            _range_event = {}
            event, [bt, et] = index

            _s = df.iloc[bt].to_dict()
            _e = df.iloc[et].to_dict()

            assert _s["name"] == _e["name"]
            assert _s[column] == "B" and _e[column] == "E"

            _range_event = copy.deepcopy(_s)
            _range_event["className"] = (
                self.rules[_s["group"]]["class_name"]
                if "className" not in override
                else override["className"]
            )
            _range_event["dur"] = _e["ts"] - _s["ts"]
            _range_event["end"] = _e["ts"]
            _range_event["group"] = (
                self.grp_to_index[_s["group"]]
                if "group" not in override
                else override["group"]
            )
            _range_event["start"] = _s["ts"]

            del _range_event["ts"]

            ret.append(_range_event)

        ret_df = pd.DataFrame(ret)
        ret_df = ret_df.drop(columns=["ph"])

        # NOTE: Move this to the rules.
        ret_df["content"] = (
            ret_df["name"]
            if ret_df["group"].unique().tolist()[0] == SNPROF_GROUP_INDEX
            else ret_df["content"]
        )

        return ret_df

    def construct_timeline_df_dict(self) -> Dict[str, pd.DataFrame]:
        """
        Process the timeline dataframe by grouping the events based on the allowed event types.
        """
        df_dict = {}
        assert "type" in self.timeline_df.columns
        _grp_df = self.timeline_df.groupby("type")

        for type, grp in _grp_df:
            grp = grp.sort_values(by=["ts"])

            if type in ["range", "background"]:
                df_dict[type] = self.construct_range_df(grp)
            elif type == "point":
                df_dict[type] = self.construct_point_df(grp)
            else:
                raise ValueError("Invalid type detected in the `self.rules`")

        return df_dict

    def construct_subgroup_timeline_df_dict(self) -> Dict[str, pd.DataFrame]:
        """
        Construct a timeline df for the sub_group's present inside the events.
        """
        sub_group_df_dict = {}
        for grp in self.rules:
            if "nested_events" in self.rules[grp]:
                sub_group_df_dict[grp] = pd.DataFrame({})

                _start_df = self.timeline_df.loc[
                    (self.timeline_df["name"] == grp) & (self.timeline_df["ph"] == "B")
                ]
                _end_df = self.timeline_df.loc[
                    (self.timeline_df["name"] == grp) & (self.timeline_df["ph"] == "E")
                ]

                assert _start_df.shape == _end_df.shape

                for idx in range(_start_df.shape[0]):
                    rt_start_time = _start_df["ts"].tolist()[idx]
                    rt_end_time = _end_df["ts"].tolist()[idx]

                    row = _end_df.iloc[idx]

                    args = self.get_event_args(row["id"])

                    if args is not None and "traceEvents" in args.keys():

                        # TODO: (surajk) Hack here. we need to be able to filter out 'M' events before this stage, grouping the events per timeline would help.
                        _df = self.to_df(args["traceEvents"], skip_keys=["args"])
                        _df["rt_id"] = row["id"]

                        # NOTE: We assume the sub_group events are only going to be range-based events.
                        _range_df = self.construct_range_df(
                            _df,
                            override={"group": SNPROF_GROUP_INDEX, "className": grp},
                        )

                        new_rt_events_df = Timeline.add_rt_setup_and_teardown_events(
                            _range_df, rt_start_time, rt_end_time
                        )
                        new_rt_events_df["content"] = new_rt_events_df["name"]

                        _range_df = pd.concat([_range_df, new_rt_events_df])

                        sub_group_df_dict[grp] = pd.concat(
                            [sub_group_df_dict[grp], _range_df]
                        )

        return sub_group_df_dict

    ################### Post-processing functions ###################
    @staticmethod
    def combine_events(
        grp_df_dict: Dict[str, pd.DataFrame],
        sub_grp_df_dict: Dict[str, pd.DataFrame] = None,
        exclude_background: bool = False,
    ) -> List[Dict]:
        """
        Combines all the events across the different event type dataframes.
        """
        types = list(grp_df_dict.keys())

        if "background" in grp_df_dict and exclude_background:
            types.remove("background")

        combined_events_list = [grp_df_dict[type].to_dict("records") for type in types]

        if sub_grp_df_dict is not None:
            groups = list(sub_grp_df_dict.keys())
            for grp in groups:
                combined_events_list.append(sub_grp_df_dict[grp].to_dict("records"))

        return list(itertools.chain.from_iterable(combined_events_list))

    @staticmethod
    def groups_for_vis_timeline(grp_to_index: Dict, all_events: List = []) -> Dict:
        """
        Constructs the groups for the vis-timeline interface.
        Groups to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        TODO: (surajk) Restructure this piece of code to assign ids to sub_grps.
        """
        ret = []
        group_vertical_ordering = ["tracing", "compile", "runtime", "snprof", "Epoch"]
        include_snprof = False
        for event in all_events:
            if event in group_vertical_ordering:
                _obj = {
                    "id": grp_to_index[event],
                    "content": event,
                    "value": group_vertical_ordering.index(event),
                }
                if event == "runtime" and include_snprof:
                    _obj["nestedGroups"] = [SNPROF_GROUP_INDEX]
                    _obj["treeLevel"] = 1
                    _obj["showNested"] = False
                ret.append(_obj)
            else: # NOTE: Here we treat all events not in grp_to_index to belong to `runtime (aka snprof)`
                include_snprof = True

        if include_snprof:
            ret.append(
                {"id": SNPROF_GROUP_INDEX, "content": "snprof", "treeLevel": 2, "value": group_vertical_ordering.index("snprof")}
            )

        return ret

    ################### Exposed APIs ###################
    def get_all_events(self, event_types: List) -> List:
        if len(event_types) > 0:
            _df = self.timeline_df[self.timeline_df["type"].isin(event_types)]
        else:
            _df = self.timeline_df

        ret = _df["group"].unique().tolist()

        if "range" in event_types:
            for grp in self.sub_grp_df_dict:
                _df = self.sub_grp_df_dict[grp]
                if not _df.empty:
                    ret += self.sub_grp_df_dict[grp]["name"].unique().tolist()

        return list(set(ret))

    def get_event_count(self) -> int:
        return len(self.timeline)

    def get_start_timestamp(self) -> float:
        return self.start_ts

    def get_end_timestamp(self) -> float:
        return self.end_ts

    def get_metadata(self, exp) -> Dict:
        profile_metadata = {
            k: v
            for k, v in self.profile.items()
            if k not in ["data", "test", "data_list", "description_orig"]
        }
        test_metadata = {
            k: v
            for k, v in self.profile["test"].items()
            if k in ["owner", "test list", "arch", "timeout"]
        }

        derived_metadata = {
            "timelineStart": self.start_ts,
            "timelineEnd": self.end_ts,
            "selectedExperiment": exp
        }

        _all_metadata = list(test_metadata.items()) + list(profile_metadata.items())
        _all_metadata_sorted = sorted(_all_metadata, key=lambda x: x[0].lower())

        return {
            "general": derived_metadata,
            "profile": [{"name": _m[0], "key": _m[1]} for _m in _all_metadata_sorted],
        }

    def get_summary(self, sample_count=50) -> Dict:
        """
        Returns the summary timeline based on uniform-sampling.
        """
        events = Timeline.combine_events(self.grp_df_dict, exclude_background=True)

        ts_width = math.ceil((self.end_ts - self.start_ts) / sample_count)
        ts_samples = [
            math.ceil(sample)
            for sample in np.arange(self.start_ts, self.end_ts, ts_width)
        ]
        events_in_sample = {_s: {grp: 0 for grp in self.rules} for _s in ts_samples}

        for event in events:
            group = self.index_to_grp[event["group"]]

            ts = np.array([event["start"], event["end"]])
            dig = np.digitize(ts, ts_samples)

            if dig[0] == dig[1]:
                events_in_sample[ts_samples[dig[0] - 1]][group] += (
                    event["end"] - event["start"]
                )
            else:
                _l = event["start"]
                _h = event["end"]
                for i in range(dig[0], dig[1]):
                    events_in_sample[ts_samples[i - 1]][group] += ts_samples[i] - _l
                    _l = ts_samples[i]

                if i <= len(ts_samples) - 1:
                    events_in_sample[ts_samples[i]][group] += _h - ts_samples[i]

        for [sample, val] in events_in_sample.items():
            val["ts"] = sample

        return {
            "data": list(events_in_sample.values()),
            "groups": list(self.rules.keys()),
            "samples": list(ts_samples),
            "start_ts": self.start_ts,
            "ts_width": ts_width,
            "window": SLIDING_WINDOW,
        }

    def get_timeline(self, window_start=None, window_end=None) -> Dict:
        """
        Returns the events in a given window. If a window is not provided, it will default to the start and end timestamp of the profile.
        """
        if not window_start:
            window_start = self.start_ts

        if not window_end:
            window_end = self.end_ts

        # TODO: (surajk) Index the dataframe based on timestamp and allow selection based on window_start, and window_end.
        # For this task, we will have to construct a `df_dict`, where each entry comprises of events in the window.
        all_events = self.get_all_events(["point", "range", "background"])
        events = Timeline.combine_events(self.grp_df_dict, self.sub_grp_df_dict)
        groups = Timeline.groups_for_vis_timeline(self.grp_to_index, all_events)

        return {
            "end_ts": window_start,
            "events": events,
            "groups": groups,
            "start_ts": window_end,
        }

    def get_event_summary(self, event_types=["point", "range", "background"]):
        """
        Returns the event-duration summary.
        """
        events = self.get_all_events(event_types)
        durations = {e: 0 for e in events}

        grp_to_index = self.timeline_df.set_index("name").to_dict()["group"]

        # Collect event durations from the group events.
        for _type in event_types:
            _df = self.grp_df_dict[_type]
            agg = group_by_and_apply_sum(_df, "dur")
            durations = combine_dicts_and_sum_values(durations, agg["dur"])

        subgrp_to_index = {}
        # Collect event durations from the sub-group events.
        for grp in self.sub_grp_df_dict:
            _df = self.sub_grp_df_dict[grp]
            if not _df.empty:

                # NOTE: (surajk) This is incorrect, `df.set_index("name").to_dict()["className"]`, we use className as a hack becasue `group` is an index, and we dont have a good way to handle the addition of runtime events.
                subgrp_to_index = {
                    **_df.set_index("name").to_dict()["group"],
                    **subgrp_to_index,
                }

                agg = group_by_and_apply_sum(_df, "dur")
                durations = combine_dicts_and_sum_values(durations, agg["dur"])

                grp_to_index = {**grp_to_index, **subgrp_to_index}

        result = [
            {
                "event": event.upper(),
                "dur": durations[event],
                "group": grp_to_index[event],
            }
            for event in events
        ]
        return sorted(result, key=lambda x: x["dur"], reverse=True)
