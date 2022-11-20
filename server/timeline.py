import copy
import itertools
import math
import json
from operator import sub
import numpy as np
import pandas as pd
import re
import os
from typing import Dict, List, Tuple

from server.logger import get_logger
from server.rules import Rules
from server.utils import (
    load_json,
    group_by_and_apply_sum,
    combine_dicts_and_sum_values,
    dict_to_list_of_vals,
)

LOGGER = get_logger(__name__)

EVENT_TYPES = ["background", "point", "range"]
ALLOWED_EVENT_PH = ["B", "E", "X"]

# Pandas automatically converts to scientific notation when creating new dataframes.
# To avoid this, we set the pandas options to format to float gloablly.
# https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/25
pd.options.display.float_format = "{:.3f}".format


class Timeline:
    def __init__(self, file_path: str, profile_format: str):
        """
        Initializes a Timeline object.
        """
        self.profile_format = profile_format
        # Derive the rules based on profile_format and read json from file_path.
        self.rules, self.timeline, self.metadata = self.init(file_path, profile_format)

        self.calculate_mappers()

        if len(self.timeline) == 0:
            LOGGER.error(f"No events found in {file_path}!")
            exit(1)

        # Access the properties from the JSON.
        self.start_ts = self.timeline[0]["ts"]
        self.end_ts = self.timeline[-1]["ts"]

        # Convert the timeline to a pandas.DataFrame
        # NOTE: We skip args at the moment because of its dtype=JSON, which requires further refactor to convert to a valid column in timeline_df.
        # TODO: Add `args` to the final timeline_df.
        # https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/23
        self.timeline_df = self.to_df(self.timeline, skip_keys=["args"])
        LOGGER.debug(
            f"Constructed the timeline dataframe with {self.timeline_df.shape[0]} events"
        )

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

        self.event_to_grp = self.construct_event_to_grp_dict()
        self.grp_to_events = dict_to_list_of_vals(self.event_to_grp)

        self.event_durations = self.construct_event_duration_dict()

    ################### Pre-processing functions ###################
    def init(self, file_path: str, format: str) -> None:
        """
        1. Reads the JSON object.
        2. Validate JSON (TODO).
        3. Based on format, self.rules object is created. NOTE: For new formats, add a new rule in Rules.py.
        4. Assign the "traceEvents" to the self.timeline
        5. Adds metadata, if available.

        :params: file_path : Path of the Chrome trace JSON
        :params: format : supports two formats, JIT & SNPROF.
        """
        LOGGER.debug(f"Loading {file_path} as a timeline.")
        # Read the timeline JSON.
        profile = load_json(file_path=file_path)

        # Derive the rules, timeline and metadata based on the format.
        if format == "JIT":
            rules = Rules().jit()

            # NOTE: Current structure in JIT Profiler dumps the data into json["data"]["traceEvents"].
            if "data" not in profile.keys():
                LOGGER.error(
                    f"Are you sure the timeline format for {file_path} is {format}? Looks like it's not ;("
                )
                exit(1)

            if "traceEvents" not in profile["data"].keys():
                LOGGER.error(f"Missing field: `traceEvents`")
                exit(1)

            timeline = profile["data"]["traceEvents"]
            metadata = Timeline.jit_metadata(profile)

        elif format == "SNPROF":
            rules = Rules().snprof()

            if "traceEvents" not in profile.keys():
                LOGGER.error(f"Missing field: `traceEvents`")
                exit(1)

            timeline = profile["traceEvents"]
            metadata = {}

        elif format == "KINETO":
            rules = Rules().kineto()

            if "traceEvents" not in profile.keys():
                LOGGER.error(f"Missing field: `traceEvents`")
                exit(1)

            timeline = profile["traceEvents"]
            metadata = [
                {"name": _k, "key": _v}
                for _k, _v in profile["deviceProperties"][0].items()
            ]
            metadata.append({"name": 'gpuUtilization', "key": self.get_gpu_utilization(file_path, ' utilization_gpu') })
            mem_util = self.get_gpu_utilization(file_path, ' utilization_memory')
            mem_util.reverse()
            metadata.append({"name": 'memUtilization', "key": mem_util})

        else:
            LOGGER.error("Invalid profile format!")

        # Assert if the required fields in rules that are used by this class are present.
        assert set(["grouping", "ordering"]) == set(rules.keys())

        # Filter out events that are not part of ALLOWED_EVENT_PH
        # NOTE: Some of the metadata events are ignored because they dont have a Begin or End phase.
        timeline = [e for e in timeline if e["ph"] in ALLOWED_EVENT_PH]

        return rules, timeline, metadata

    def calculate_mappers(self):
        self.grp_to_idx = {grp: idx for idx, grp in enumerate(self.rules["ordering"])}
        self.idx_to_grp = {idx: grp for idx, grp in enumerate(self.rules["ordering"])}

        self.grp_to_cls = {}
        for idx, grp in enumerate(self.rules["ordering"]):
            if grp in self.rules["grouping"]:
                grouping_rule = self.rules["grouping"][grp]

                if grouping_rule["event_type"] == "background":
                    class_prefix = "bg"
                else:
                    class_prefix = "fg"
            else:  # TODO: (surajk) sub-groups should have categorical colors!
                class_prefix = "fg"

            self.grp_to_cls[grp] = class_prefix + "-" + str(idx % 4 + 1)
        self.cls_to_grp = dict_to_list_of_vals(self.grp_to_cls)

    def to_df(self, timeline: json, skip_keys=[]) -> pd.DataFrame:
        keys = timeline[0].keys()
        f_keys = [i for i in keys if i not in skip_keys]
        _df = pd.DataFrame({key: [e[key] for e in timeline] for key in f_keys})

        # NOTE: We lose a bit of precision here because we round to the nearest integer.
        # TODO: Remove this once we make sure the timestamps are double.
        # https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/25
        _df["ts"] = _df["ts"].apply(lambda d: int(d))
        return _df

    def add_vis_fields(self) -> None:
        """
        Add the vis fields to each row in timeline_df based on the type of event.
        # TODO: Consider employing builder pattern to add/remove fields on the dataframe.
        # https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/24
        """
        group_rules = self.rules["grouping"]

        for idx, event in self.timeline_df.iterrows():
            # Add "group", "type" fields.
            _group, _type = Timeline.match_event_group_and_type(event, group_rules)
            _event = self.get_event_by_id(idx)
            _event = self.get_event_by_id(idx)

            self.timeline_df.at[idx, "group"] = _group
            self.timeline_df.at[idx, "type"] = _type

            # Add "content" field.
            if "content" in group_rules[_group].keys():
                _args = self.get_event_args(idx)
                _content = group_rules[_group]["content"](_args)
            else:
                _content = ""

            self.timeline_df.at[idx, "content"] = _event["name"]

    def construct_point_df(
        self, df: pd.DataFrame, column: str = "ph", override: Dict = {}
    ) -> pd.DataFrame:
        """
        Construct the dataframe containing the point-based events.
        """
        assert column in df.columns
        grouping_rules = self.rules["grouping"]

        ret = []
        for idx, row in df.iterrows():
            _e = row.to_dict()

            _e["className"] = self.grp_to_cls[_e["group"]]
            _e["idx"] = idx
            _e["dur"] = (
                0 if _e["ph"] == "i" else _e["dur"]
            )  # Duration for a point event is 0
            _e["group"] = self.grp_to_idx[_e["group"]]
            _e["start"] = _e["ts"]

            if _e["ph"] == "X":
                _e["end"] = _e["start"] + _e["dur"]
                _e["type"] = "range"

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

        grouping_rules = self.rules["grouping"]

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
                self.grp_to_cls[_e["group"]]
                if "className" not in override
                else override["className"]
            )
            _range_event["dur"] = _e["ts"] - _s["ts"]
            _range_event["end"] = _e["ts"]
            _range_event["group"] = (
                self.grp_to_idx[_s["group"]]
                if "group" not in override
                else override["group"]
            )
            _range_event["start"] = _s["ts"]

            del _range_event["ts"]

            ret.append(_range_event)

        ret_df = pd.DataFrame(ret)
        ret_df = ret_df.drop(columns=["ph"])

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
            elif type in ["point", "x-range"]:
                df_dict[type] = self.construct_point_df(grp)
            elif type == "x-range":
                df_dict[type] = self.construct_x_range_df(grp)
            else:
                raise ValueError("Invalid type detected in the `self.rules`")

        return df_dict

    def construct_subgroup_timeline_df_dict(self) -> Dict[str, pd.DataFrame]:
        """
        Construct a timeline df for the sub_group's present inside the rule for a given group.
        NOTE: Sub-groups are only supported for "range" and "background" events.
        """
        grouping_rules = self.rules["grouping"]
        sub_group_df_dict = {}
        for grp in grouping_rules:
            if "sub_groups" in grouping_rules[grp]:
                _rule = grouping_rules[grp]["sub_groups"]

                # Point to the key containing the data for each sub group.
                if "data" not in _rule or "name" not in _rule:
                    LOGGER.error(
                        f"sub_group for {grp} in the rules object does have 'data' key."
                    )
                sub_group_data_key = _rule["data"]
                sub_group_name = _rule["name"]

                sub_group_df_dict[grp] = pd.DataFrame({})

                _start_df = self.timeline_df.loc[
                    (self.timeline_df["name"] == grp) & (self.timeline_df["ph"] == "B")
                ]
                _end_df = self.timeline_df.loc[
                    (self.timeline_df["name"] == grp) & (self.timeline_df["ph"] == "E")
                ]

                assert _start_df.shape == _end_df.shape

                for idx in range(_start_df.shape[0]):
                    # NOTE: There is an assumption here that only `End` events might have `traceEvents`.
                    # This was mainly because we collect `snprof` events and attach to `runtime` context.
                    # TODO: Make this more generalizable to consume `traceEvents` even from the `Begin` events.
                    # https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/26
                    rt_start_time = _start_df["ts"].tolist()[idx]
                    rt_end_time = _end_df["ts"].tolist()[idx]

                    row = _end_df.iloc[idx]

                    args = self.get_event_args(row["id"])

                    if args is not None and sub_group_data_key in args.keys():
                        _df = self.to_df(args[sub_group_data_key], skip_keys=["args"])
                        _df["rt_id"] = row["id"]
                        _df["content"] = _df["name"]
                        _df["group"] = sub_group_name

                        _range_df = self.construct_range_df(
                            _df,
                            override={"className": grp},
                        )

                        # NOTE: Special condition to add Runtime setup and teardown events.
                        # We did this because `snprof` was not outputting the setup and teardown stages.
                        # if self.profile_format == "JIT" and grp == "runtime":
                        new_rt_events_df = Timeline.add_rt_setup_and_teardown_events(
                            _range_df, rt_start_time, rt_end_time
                        )

                        _range_df = pd.concat([_range_df, new_rt_events_df], sort=False)

                        sub_group_df_dict[grp] = pd.concat(
                            [sub_group_df_dict[grp], _range_df]
                        )

        return sub_group_df_dict

    def construct_event_to_grp_dict(self) -> Dict[str, str]:
        """ """
        # event_to_grp = self.timeline_df.set_index("name").to_dict()["group"]

        event_to_grp = {}
        for key in self.grp_df_dict:
            if key in self.grp_df_dict:
                _df = self.grp_df_dict[key]
                event_to_grp = {
                    **_df.set_index("name").to_dict()["group"],
                    **event_to_grp,
                }

        event_to_subgrp = {}
        for grp in self.sub_grp_df_dict:
            _df = self.sub_grp_df_dict[grp]
            if not _df.empty:

                event_to_subgrp = {
                    **_df.set_index("name").to_dict()["group"],
                    **event_to_subgrp,
                }

                event_to_grp = {**event_to_grp, **event_to_subgrp}

        return event_to_grp

    def construct_event_duration_dict(self, include_sub_groups=False) -> Dict[str, str]:
        all_events = list(self.event_to_grp.keys())
        event_types = list(self.grp_df_dict.keys())
        durations = {event: 0 for event in all_events}

        # Collect event durations from the group events.
        for _type in event_types:
            if _type in self.grp_df_dict:
                _df = self.grp_df_dict[_type]
                agg = group_by_and_apply_sum(_df, "dur")
                durations = combine_dicts_and_sum_values(durations, agg["dur"])

        # Collect event durations from the sub-group events.
        if include_sub_groups:
            for grp in self.sub_grp_df_dict:
                _df = self.sub_grp_df_dict[grp]
                if not _df.empty:
                    agg = group_by_and_apply_sum(_df, "dur")
                    durations = combine_dicts_and_sum_values(durations, agg["dur"])

        return durations

    ################### Supporting functions ###################
    @staticmethod
    def match_event_group_and_type(event, rules):
        """
        Utility function to match the events to correspoinding group and vis_type based on the rules object.
        """
        group = None
        type = None

        if event["ph"] in ["B", "E"]:
            type = "range"
        elif event["ph"] == "i":
            type = "point"
        elif event["ph"] == "X":
            type = "x-range"
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
    def add_rt_setup_and_teardown_events(
        rt_df, rt_start_time, rt_end_time
    ) -> pd.DataFrame:
        """
        Adds runtime setup and teardown events to the runtime dataframe.
        """
        pid = rt_df["pid"].unique().tolist()[0]
        tid = rt_df["tid"].unique().tolist()[0]
        rt_id = rt_df["rt_id"].unique().tolist()[0]
        className = rt_df["className"].unique().tolist()[0]
        group = rt_df["group"].unique().tolist()[0]

        rt_setup_dict = {
            "className": className,
            "content": "RT_SETUP",
            "dur": rt_df["start"].min() - rt_start_time,
            "end": rt_df["start"].min(),
            "rt_id": rt_id,
            "group": group,
            "name": "RT_SETUP",
            "pid": pid,
            "start": rt_start_time,
            "tid": tid,
        }

        rt_teardown_dict = {
            "className": className,
            "content": "RT_TEARDOWN",
            "dur": rt_end_time - rt_df["end"].max(),
            "end": rt_end_time,
            "rt_id": rt_id,
            "group": group,
            "name": "RT_TEARDOWN",
            "pid": pid,
            "start": rt_df["end"].max(),
            "tid": tid,
        }

        rt_setup_df = pd.DataFrame(data=rt_setup_dict, index=[rt_df.shape[0] + 1])
        rt_teardown_df = pd.DataFrame(data=rt_teardown_dict, index=[rt_df.shape[0] + 1])
        return pd.concat([rt_setup_df, rt_teardown_df])

    @staticmethod
    def jit_metadata(profile: json) -> List[Dict]:
        """
        Constructs the metadata for JIT Profiler.
        NOTE: This is used by the metadata view (visualized as a table).

        :params: profile = JIT Profile
        :returns: sorted list of name:key pairs
        """
        profile_metadata = {
            k: v
            for k, v in profile.items()
            if k not in ["data", "test", "data_list", "description_orig"]
        }
        test_metadata = {
            k: v
            for k, v in profile["test"].items()
            if k in ["owner", "test list", "arch", "timeout"]
        }

        _all_metadata = list(test_metadata.items()) + list(profile_metadata.items())
        _all_metadata_sorted = sorted(_all_metadata, key=lambda x: x[0].lower())

        return [{"name": _m[0], "key": _m[1]} for _m in _all_metadata_sorted]

    ################### Post-processing functions ###################
    @staticmethod
    def combine_events(
        grp_df_dict: Dict[str, pd.DataFrame],
        sub_grp_df_dict: Dict[str, pd.DataFrame] = None,
        grp_to_idx: Dict[str, str] = None,
        exclude_background: bool = False,
    ) -> List[Dict]:
        """
        Combines all the events across the different event type dataframes.
        https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/27
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
    def slice_and_combine_events(
        grp_df_dict: Dict[str, pd.DataFrame],
        window_start: float,
        window_end: float,
        exclude_background: bool = False,
    ): 
        types = list(grp_df_dict.keys())

        if "background" in grp_df_dict and exclude_background:
            types.remove("background")

        combined_events_list = []
        for type in types:
            _df = grp_df_dict[type]
            _fdf = _df.loc[(_df['start'] <= window_end) & (_df["start"] >= window_start)]
            combined_events_list.append(_fdf.to_dict("records"))

        return list(itertools.chain.from_iterable(combined_events_list))

    def groups_for_vis_timeline(self) -> Dict:
        """
        Constructs the groups for the vis-timeline interface.
        Groups to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        TODO: Restructure this piece of code to assign ids to sub_grps.
        https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/26
        """
        ret = []

        all_groups = self.get_uniques_from_timeline(
            ["point", "range", "background", "x-range"], column="group"
        )
        ordering_rules = self.rules["ordering"]

        for grp_idx in all_groups:
            group = self.idx_to_grp[grp_idx]
            _obj = {
                "id": grp_idx,
                "content": group,
                "value": grp_idx,
            }

            if group == "runtime":
                if ordering_rules.index("snprof") in all_groups:
                    _obj["nestedGroups"] = [ordering_rules.index("snprof")]
                    _obj["treeLevel"] = 1
                    _obj["showNested"] = False

            if group == "snprof":
                _obj["treeLevel"] = 2

            ret.append(_obj)

        ret.append({
            "id": 4,
            "content": "",
            "value": 4
        })

        return ret

    ################### Exposed APIs ###################
    def get_event_by_id(self, id: int):
        return self.timeline[id]

    def get_event_args(self, idx):
        if "args" not in self.timeline[idx]:
            return json({})

        return self.timeline[idx]["args"]

    def get_uniques_from_timeline(
        self, event_types: List, column: str, exclude_sub_grps: bool = False
    ) -> List:
        """
        Get all unique values from all rows (i.e., both timeline_df and sub_grp_df_dicts) based on a column.
        """
        ret = []
        for type in event_types:
            if type in self.grp_df_dict:
                _df = self.grp_df_dict[type]
                ret += self.grp_df_dict[type][column].unique().tolist()

        if not exclude_sub_grps:
            for grp in self.sub_grp_df_dict:
                _df = self.sub_grp_df_dict[grp]
                if not _df.empty:
                    ret += self.sub_grp_df_dict[grp][column].unique().tolist()

        return list(set(ret))

    def get_event_count(self) -> int:
        return len(self.timeline)

    def get_start_timestamp(self) -> float:
        return self.start_ts

    def get_end_timestamp(self) -> float:
        return self.end_ts

    def get_gpu_utilization(self, file_path, metric):
        gpu_file_path = os.path.join("/".join(file_path.split("/")[:-1]), "gpu_utilization.csv")
        # df = pd.read_csv(gpu_file_path)
        # return df[metric].tolist()
        return []

    def get_occupancy(self) -> float:
        df = self.grp_df_dict["x-range"]
        kernel_df = df.loc[df['cat'] == 'kernel']
        indexes = kernel_df['idx'].tolist()
        occupancy = 0
        for index in indexes:
            occupancy += float(self.get_event_args(index)["est. achieved occupancy %"])
        return occupancy#  / len(indexes)

    def get_cpu_utilization(self) -> float:
        df = self.grp_df_dict["x-range"]
        kernel_df = df.loc[df['cat'] == 'kernel']
        indexes = kernel_df['idx'].tolist()
        mem = 0
        for index in indexes:
            mem += float(self.get_event_args(index)["blocks per SM"])

        return round((mem / 49152) * 100, 2)

    def get_shared_mem_utilization(self) -> float:
        df = self.grp_df_dict["x-range"]
        kernel_df = df.loc[df['cat'] == 'kernel']
        indexes = kernel_df['idx'].tolist()
        mem = 0
        for index in indexes:
            mem += float(self.get_event_args(index)["shared memory"])
        return round((mem / 49152) * 100, 2)


    def get_metadata(self, exp) -> Tuple[Dict, Dict]:
        """
        Get the metadata for a Timeline.
        """
        return {
            "general": {
                "timelineStart": self.start_ts,
                "timelineEnd": self.end_ts,
                "selectedExperiment": exp,
                "achievedOccupancy": self.get_occupancy(),
                "cpuUtilization": self.get_cpu_utilization(),
                "sharedMemUtilization": self.get_shared_mem_utilization()
            },
            "profile": self.metadata,
        }

    def get_summary(self, sample_count=50) -> Dict:
        """
        Returns the summary timeline based on uniform-sampling.
        """
        events = Timeline.combine_events(
            self.grp_df_dict, grp_to_idx=self.grp_to_idx, exclude_background=True
        )

        ts_width = math.ceil((self.end_ts - self.start_ts) / sample_count)
        ts_samples = [
            math.ceil(sample)
            for sample in np.arange(self.start_ts, self.end_ts, ts_width)
        ]
        events_in_sample = {
            _s: {grp: 0 for grp in self.rules["grouping"]} for _s in ts_samples
        }

        for event in events:
            group = self.idx_to_grp[event["group"]]

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

        max_ts = 0

        for [sample, val] in events_in_sample.items():
            max_ts = max(sum(val.values()), max_ts)
            val["ts"] = sample

        return {
            "classNames": self.grp_to_cls,
            "maxY": max_ts,
            "startTs": self.start_ts,
            "endTs": self.end_ts,
            "ts_width": ts_width,
            "yData": list(events_in_sample.values()),
            "xData": list(ts_samples),
            "zData": list(self.rules["grouping"].keys()),
            # "gpuUtilization": self.metadata[-2]["key"],
            # "memUtilization": self.metadata[-1]["key"]
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
        events = Timeline.combine_events(
            self.grp_df_dict,
            sub_grp_df_dict=self.sub_grp_df_dict,
            grp_to_idx=self.grp_to_idx,
        )
        groups = self.groups_for_vis_timeline()

        return {
            "end_ts": window_start,
            "events": events,
            "groups": groups,
            "start_ts": window_end,
        }

    def get_window(self, window_start, window_end) -> Dict:
        """
        Returns the events in a given windoow.
        """
        events = Timeline.slice_and_combine_events(
            self.grp_df_dict, window_start=window_start, window_end=window_end
        )
        return events

    def get_timeline_summary(
        self,
        event_types=["point", "range", "x-range"],
        include_sub_groups=False,
    ):
        """
        Returns the event-duration summary.
        TODO: Major clean up needed here. Clarify what is a group_idx and group.
        Also make sure the logic is simplified to only show the events that are toggled on in the timeline view.
        """
        all_groups_idx = self.get_uniques_from_timeline(
            event_types, column="group", exclude_sub_grps=(not include_sub_groups)
        )
        # Sum all the durations within each group.
        grp_durations = {grp: 0 for grp in all_groups_idx}
        for grp_idx in all_groups_idx:
            for event in self.grp_to_events[grp_idx]:
                if event in self.event_durations:
                    grp_durations[grp_idx] += self.event_durations[event]

        result = []
        for grp_idx in all_groups_idx:
            group = self.idx_to_grp[grp_idx]
            result.append(
                {
                    "event": group.upper(),
                    "dur": grp_durations[grp_idx],
                    "group": group,
                    "class_name": self.grp_to_cls[group],
                }
            )

        return sorted(result, key=lambda x: x["dur"], reverse=True)

    def get_event_summary(
        self,
        groups=[],
        event_types=["point", "range", "x-range"],
        include_sub_groups=False,
    ):
        """ """
        # Determine the groups that should be visualized, if not provided, all
        # events are visualized.
        if len(groups) == 0:
            all_groups_idx = self.get_uniques_from_timeline(
                event_types, column="group", exclude_sub_grps=(not include_sub_groups)
            )
            all_groups = [self.idx_to_grp[grp_idx] for grp_idx in all_groups_idx]
            groups = all_groups

        all_events = []
        for group in groups:
            group_idx = self.grp_to_idx[group]
            all_events = all_events + self.grp_to_events[group_idx]

        result = [
            {
                "event": event,
                "dur": self.event_durations[event],
                "group": self.event_to_grp[event],
                "class_name": self.grp_to_cls[
                    self.idx_to_grp[self.event_to_grp[event]]
                ],
            }
            for event in all_events
        ]

        return sorted(result, key=lambda x: x["dur"], reverse=True)
