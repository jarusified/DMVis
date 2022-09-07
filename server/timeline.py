import copy
import itertools
import math
import json
import numpy as np
import pandas as pd
import re

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

# Pandas automatically converts to scientific notation when creating new dataframes. To avoid this, we set the pandas options to format to float gloablly.
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

        TODO (surajk): Add validation for the chrome trace format.
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
                "sub_group": "traceEvents",
                "content": lambda e: "Tensor ",  # + e["args"]["tensor size"],
                "class_name": "runtime",
            },
            "compile": {
                "regex": ["compile"],
                "event_type": "range",
                "content": lambda e: " ",
                "class_name": "compile",
            },
            "tracing": {
                "regex": ["tracing"],
                "event_type": "range",
                "content": lambda e: " ",
                "class_name": "tracing",
            },
            "Epoch": {
                "regex": ["Epoch"],
                "event_type": "background",
                "content": lambda e: "epoch-" + str(e["args"]["epoch_id"])
                if e["args"] is not None and "epoch_id" in e["args"]
                else "",
                "class_name": "epoch",
            },
        }

        # loads the profile
        self.profile = load_json(file_path=file_path)

        self.timeline = self.profile["data"]["traceEvents"]
        self.start_ts = self.profile["data"]["startTimestamp"]
        self.end_ts = self.profile["data"]["endTimestamp"]

        # TODO: (surajk) Need to jsonize the args and create hierarchies inside the timeline_df for runtime.
        # Convert the timeline to a pandas.DataFrame
        self.timeline_df = Timeline.to_df(self.timeline, skip_keys=["args"])

        # Add vis-related fields as columns in the dataframe.
        #   "group": determined by the self.rules
        #   "type": determined by the event type: 'point', 'range', and 'background'.
        self.add_vis_fields()

        self.grp_to_index, self.index_to_grp = construct_mapper(self.rules)

        # Process the dataframe according to their respective types.
        self.grp_df_dict = self.construct_timeline_df_dict()

        # Process the sub_group timelines in the events. If a sub_group is not present, we have an empty dataframe.
        self.sub_grp_df_dict = self.construct_subgroup_timeline_df_dict()

    ################### Supporting functions ###################
    @staticmethod
    def _match_event_group_and_type(event, rules):
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
    def combine_events(df_dict: dict[str, pd.DataFrame]) -> list[dict]:
        """
        Combines all the events across the different event type dataframes.
        """
        combined_events_list = [
            df_dict[type].to_dict("records") for type in df_dict.keys()
        ]
        return list(itertools.chain.from_iterable(combined_events_list))

    def get_event_by_id(self, id: int):
        return self.timeline[id]

    def get_event_args(self, idx):
        if "args" not in self.timeline[idx]:
            return json({})

        return self.timeline[idx]["args"]

    def get_all_events(self):
        ret = self.timeline_df["name"].unique().tolist()

        for grp in self.sub_grp_df_dict:
            for grp_id in self.sub_grp_df_dict[grp]:
                ret += self.sub_grp_df_dict[grp][grp_id]["name"].unique().tolist()

        return list(set(ret))

    ################### Pre-processing functions ###################
    @staticmethod
    def to_df(timeline, skip_keys=[]) -> pd.DataFrame:
        keys = timeline[0].keys()
        f_keys = [i for i in keys if i not in skip_keys]
        _df = pd.DataFrame({key: [e[key] for e in timeline] for key in f_keys})
        return _df

    def add_vis_fields(self) -> None:
        """
        Add the vis fields based on the type of event.
        # TODO: (surajk) Create vis_fields for the "traceEvents" fields inside the args.
        # NOTE: (surajk) Think hard. We maybe can use a builder pattern here.
        """
        for idx, event in self.timeline_df.iterrows():
            # Check if there is a "traceEvents" field in the args.
            # if event["args"] is not None and "traceEvents" in event["args"]:
            #     for sub_event in event["args"]["traceEvents"]:
            #         sub_event["vis"] = Timeline._match_event_group_and_type(sub_event, self.rules)

            # Add "group", "type" fields.
            _group, _type = Timeline._match_event_group_and_type(event, self.rules)
            self.timeline_df.at[idx, "group"] = _group
            self.timeline_df.at[idx, "type"] = _type

            # Add "content" field.
            if "content" in self.rules[event["name"]].keys():
                _event = self.get_event_by_id(event["id"])
                _content = self.rules[event["name"]]["content"](_event)
            else:
                _content = ""
            self.timeline_df.at[idx, "content"] = _content

    def construct_point_df(
        self, df: pd.DataFrame, column: str = "ph", override: dict = {}
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
        self, df: pd.DataFrame, column: str = "ph", override: dict = {}
    ) -> pd.DataFrame:
        """
        Construct the dataframe containing the range-based events.
        """
        assert column in df.columns

        ret = []
        for idx in range(0, df.shape[0] - 1, 2):
            _range_event = {}
            _s = df.iloc[idx].to_dict()
            _e = df.iloc[idx + 1].to_dict()

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

        return pd.DataFrame(ret)

    def construct_timeline_df_dict(self) -> dict[str, pd.DataFrame]:
        """
        Process the timeline dataframe by grouping the events based on the allowed event types.
        """
        df_dict = {}
        assert "type" in self.timeline_df.columns
        _grp_df = self.timeline_df.groupby("type")

        for type, grp in _grp_df:
            if type in ["range", "background"]:
                df_dict[type] = self.construct_range_df(grp)
            else:
                df_dict[type] = self.construct_point_df(grp)

        return df_dict

    def construct_subgroup_timeline_df_dict(self) -> dict[str, dict[pd.DataFrame]]:
        """
        Construct a timeline df for the sub_group's present inside the events.
        """
        sub_group_df_dict = {}
        for grp in self.rules:
            if "sub_group" in self.rules[grp]:
                sub_group_df_dict[grp] = {}

                _sub_df = self.timeline_df.loc[
                    (self.timeline_df["name"] == grp) & (self.timeline_df["ph"] == "E")
                ]
                for idx, row in _sub_df.iterrows():
                    args = self.get_event_args(row["id"])

                    # TODO: (surajk) Hack here. we need to be able to filter out 'M' events before this stage, grouping the events per timeline would help.
                    _df = Timeline.to_df(args["traceEvents"][:-1])

                    # NOTE: We lose a bit of precision here because we round to the nearest integer.
                    _df["ts"] = _df["ts"].apply(lambda d: int(d))

                    # NOTE: We assume the sub_group events are only going to be range-based events.
                    sub_group_df_dict[grp][row["id"]] = self.construct_range_df(
                        _df, override={"group": grp, "className": grp}
                    )
        return sub_group_df_dict

    ################### Post-processing functions ###################
    @staticmethod
    def sliding_window(timeline, start_ts, end_ts):
        """
        Return the type: [0, 1, .... x] where x is the index in which the event of type (from TIMELINE_TYPES )
        """
        ret = {"point": [], "range": [], "background": []}
        for type in TIMELINE_TYPES:
            for idx, event in enumerate(timeline):
                event_ts = event["ts"]
                if event["_vis"]["type"] == type:
                    # if start_ts <= event_ts and event_ts <= end_ts:
                    ret[type].append(
                        {"idx": idx, "ph": event["ph"], "name": event["name"]}
                    )

            # # NOTE: The timeline will behave weirdly if the `B` and `E` phases are included even if the phase is outside the sliding window, so we will make sure the begin and end events are tracked even if they are outside the window.
            # if (type == 'range' or type == 'background') and len(ret[type]) > 0:
            #     if ret[type][-1]["ph"] == "B":
            #         print("adding to end", )
            #         this_idx = ret[type][-1]["idx"]
            #         next_end_event = timeline[this_idx + 1]
            #         ret[type].append({"idx": this_idx, "ph": next_end_event["ph"],  "name": next_end_event["name"]})

            #     if ret[type][0]["ph"] == "E":
            #         print("Adding to start", ret[type][0])
            #         this_idx = ret[type][0]["idx"]
            #         prev_begin_event = timeline[this_idx - 1]
            #         ret[type].append({"idx": this_idx, "ph": prev_begin_event["ph"],  "name": prev_begin_event["name"]})

        return ret

    def add_rt_setup_and_teardown_event(self):
        """
        """
        if "runtime" in self.sub_grp_df_dict:
            rt_events_df = self.sub_grp_df_dict["runtime"]

            for _rt_id, _rt_df in rt_events_df.items():
                rt_event = self.get_event_by_id(_rt_id)
                rt_total_time = rt_event["ts"]

                print(rt_event, rt_total_time)

            setup_teardown_dict = {}

    ################### Exposed APIs ###################
    def get_event_count(self) -> int:
        return len(self.timeline)

    def get_start_timestamp(self) -> float:
        return self.start_ts

    def get_end_timestamp(self) -> float:
        return self.end_ts

    def get_metadata(self, exp) -> dict:
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
            "selectedExperiment": exp,
        }

        _all_metadata = list(test_metadata.items()) + list(profile_metadata.items())
        _all_metadata_sorted = sorted(_all_metadata, key=lambda x: x[0].lower())

        return {
            "general": derived_metadata,
            "profile": [{"name": _m[0], "key": _m[1]} for _m in _all_metadata_sorted],
        }

    def get_summary(self, sample_count=50) -> dict:
        """
        Returns the summary timeline based on uniform-sampling.
        """

        events = Timeline.combine_events(self.grp_df_dict)

        ts_width = math.ceil((self.end_ts - self.start_ts) / sample_count)
        ts_samples = [
            math.ceil(sample)
            for sample in np.arange(self.start_ts, self.end_ts, ts_width)
        ]
        events_in_sample = {_s: {grp: 0 for grp in self.rules} for _s in ts_samples}

        for event in events:
            group = self.index_to_grp[event["group"]]
            
            ts = np.array([event['start'], event['end']])
            dig = np.digitize(ts, ts_samples)

            if dig[0] == dig[1]:
                events_in_sample[ts_samples[dig[0] - 1]][group] += (
                    event['end'] - event['start']
                )
            else:
                _l = event['start']
                _h = event['end']
                for i in range(dig[0], dig[1]):
                    events_in_sample[ts_samples[i - 1]][group] += ts_samples[i] - _l
                    _l = ts_samples[i]

                if i <= len(ts_samples) - 1:
                    events_in_sample[ts_samples[i]][group] += _h - ts_samples[i]

        for [sample, val] in events_in_sample.items():
            val["ts"] = sample

        return {
            "data": list(events_in_sample.values()),
            "end_ts": self.end_ts,
            "groups": list(self.rules.keys()),
            "samples": list(ts_samples),
            "start_ts": self.start_ts,
            "ts_width": ts_width,
            "window": SLIDING_WINDOW,
        }

    def get_timeline(self, window_start=None, window_end=None) -> dict:
        """
        Returns the events in a given window. If a window is not provided, it will default to the start and end timestamp of the profile.
        """
        if not window_start:
            window_start = self.start_ts

        if not window_end:
            window_end = self.end_ts

        # TODO: (surajk) Index the dataframe based on timestamp and allow selection based on window_start, and window_end.
        # For this task, we will have to construct a `df_dict`, where each entry comprises of events in the window.
        events = Timeline.combine_events(self.grp_df_dict)

        return {
            "end_ts": window_start,
            "events": events,
            # Get groups formmated according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
            "groups": [
                {"id": idx, "content": grp} for idx, grp in enumerate(self.rules)
            ],
            "start_ts": window_end,
        }

    def get_event_summary(self, exclude_events: list = ["Epoch"]):
        """
        Returns the event-duration summary. 
        """
        events = self.get_all_events()
        events = [e for e in events if e not in exclude_events]
        ret = {e: 0 for e in events}
        grps = {e: '' for e in events}

        grp_to_index = self.timeline_df.set_index('name').to_dict()['group']

        # Collect event durations from the group events.
        for _type in self.grp_df_dict:
            _df = self.grp_df_dict[_type]
            # dict(zip(_df.name, self.index_to_grp[_df.group]))
            agg = group_by_and_apply_sum(_df, "dur")
            ret = combine_dicts_and_sum_values(ret, agg["dur"])

        subgrp_to_index = {}
        # Collect event durations from the sub-group events.
        for grp in self.sub_grp_df_dict:
            for _idx, grp_id in enumerate(self.sub_grp_df_dict[grp]):
                _df = self.sub_grp_df_dict["runtime"][grp_id]
                subgrp_to_index = { **_df.set_index('name').to_dict()['group'], **subgrp_to_index}

                agg = group_by_and_apply_sum(_df, "dur")
                ret = combine_dicts_and_sum_values(ret, agg["dur"])

        grps = {**grp_to_index, **subgrp_to_index}

        result = [ {'event': k.upper(), 'dur': v, 'group': grps[k]}  for k, v in ret.items() ]
        return sorted(result, key=lambda x: x['dur'], reverse=True)
