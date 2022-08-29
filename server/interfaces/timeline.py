import os
import re
import json
import numpy as np
from utils.time import format_timestamp
from utils.general import remap_dict_of_list
from logger import get_logger

LOGGER = get_logger(__name__)

TIMELINE_TYPES = ["background", "point", "range"]


class Timeline:
    def __init__(self, data_dir):
        """
        Initializes a Timeline object.
        # TODO (surajk): Create event_to_idx, group_to_idx.
        """
        LOGGER.info(f"{type(self).__name__} interface triggered.")
        self.experiments = os.listdir(data_dir)

        """
        Encoding : {
            "event_group": {
                "event_names": List, // Required
                "event_type": Str, // Optional: "point" | "range" | "background" - By default, if an event has `start` and `end` timestamp, we will
            }, ... }
        """
        self.rules = {
            "runtime": {
                "regex": [
                    "runtime",
                    "FE_(\w+)",
                    "RT_(\w+)",
                    "SN_(\w+)",
                    "SAL_(\w+)",
                    "BUF_(\w+)",
                ],
                "event_type": "range",
                "sub_group": "traceEvents",
                "content": lambda e: "Tensor " + e["args"]["tensor size"],
                "class_name": "runtime",
            },
            "compile": {
                "regex": ["compile"],
                "event_type": "range",
                "content": lambda e: str(e["args"]["is cached"]),
                "class_name": "compile",
            },
            "tracing": {
                "regex": ["tracing"],
                "event_type": "range",
                "content": "",
                "class_name": "compile",
            },
            "Epoch": {
                "regex": ["Epoch"],
                "event_type": "background",
                "content": lambda e: "epoch-" + str(e["args"]["epoch_id"]),
                "class_name": "compile",
            },
        }

        self.file_paths = {
            exp: os.path.join(os.path.abspath(data_dir), exp)
            for exp in self.experiments
        }
        self.profiles = {
            exp: self.load_profiles(self.file_paths[exp]) for exp in self.experiments
        }

        LOGGER.info(f"Loaded {len(self.profiles)} profiles.")
        LOGGER.info(f"=====================================")
        for name, profile in self.profiles.items():
            LOGGER.info(f"{name} ({len(profile['data']['traceEvents'])} events) - ")
        LOGGER.info(f"=====================================")

    ################### Pre-processing functions ###################
    @staticmethod
    def _map_group_to_idx(rules):
        return {grp: idx for idx, grp in enumerate(rules)}

    @staticmethod
    def _process_event(event, rules):
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

        return {"group": group, "type": type}

    def add_vis_fields(self, timeline):
        """ """
        events = timeline["data"]["traceEvents"]

        for event in events:
            # Check if there is a "traceEvents" field in the args.
            if event["args"] is not None and "traceEvents" in event["args"]:
                for sub_event in event["args"]["traceEvents"]:
                    sub_event["vis"] = Timeline._process_event(sub_event, self.rules)

            event["_vis"] = Timeline._process_event(event, self.rules)

        timeline["_vis"] = {"group_to_idx": Timeline._map_group_to_idx(self.rules)}

        return timeline

    def load_profiles(self, file_path):
        """
        Loads a timeline from a JSON file.
        TODO (surajk): Add validation for the chrome trace format.
        2. Move this to utils
        3. Don't waste space for invalid files.
        """
        with open(file_path, "r") as f:
            try:
                d = json.load(f)
            except ValueError as e:
                return None

        timeline = self.add_vis_fields(d)
        return timeline

    @staticmethod
    def combine_runtime_events(timelines):
        """
        Utility to combine the runtime performance timeline with JIT timeline.

        """
        RUNTIME_KEY = "runtime"
        JIT_KEY = "jit"

        ret = {}
        for exp in timelines:
            runtime_events = timelines[exp]["data"][RUNTIME_KEY]
            jit_events = timelines[exp]["data"][JIT_KEY]

            proc_runtime_events = []
            for ts, context in runtime_events.items():
                events = context["traceEvents"]

                for event in events:
                    if event["ph"] in ["B", "E"]:
                        event["ts"] = int(event["ts"])

                        proc_runtime_events.append(event)
            event_names = list(set(event["name"] for event in proc_runtime_events))
            ret[exp] = proc_runtime_events + jit_events
            ret[exp] = ret[exp].sort(key=lambda x: x["ts"])
        return ret, event_names

    ################### Post-processing functions ###################
    @staticmethod
    def type_to_indices_mapping(timeline):
        """
        Return the type: [0, 1, .... x] where x is the index in which the event of type (from TIMELINE_TYPES )
        """
        ret = {"point": [], "range": [], "background": []}
        for type in TIMELINE_TYPES:
            for idx, event in enumerate(timeline):
                if event["_vis"]["type"] == type:
                    ret[type].append(idx)
        return ret

    ################### Exposed APIs ###################
    def sort_by_event_count(self):
        event_counts_dict = {exp: len(self.profiles[exp]) for exp in self.experiments}
        return list(
            dict(
                sorted(
                    event_counts_dict.items(), key=lambda item: item[1], reverse=True
                )
            ).keys()
        )

    def sort_by_date(self):
        event_counts_dict = {
            exp: self.profiles[exp]["data"]["startTimestamp"]
            for exp in self.experiments
        }
        return list(
            dict(
                sorted(
                    event_counts_dict.items(), key=lambda item: item[1], reverse=True
                )
            ).keys()
        )

    def get_summary(self, exp):
        """
        Returns the summart for a given experiment.
        """
        if exp not in self.experiments:
            return {}

        profile = self.profiles[exp]
        timeline = profile["data"]["traceEvents"]
        indices = Timeline.type_to_indices_mapping(timeline)

        return {"bars": self.get_duration_plot(timeline, indices)}

    def get_timeline(self, exp):
        """
        Returns a timeline for a given experiment.
        """
        if exp not in self.experiments:
            return {}

        profile = self.profiles[exp]
        timeline = profile["data"]["traceEvents"]
        vis_prop = profile["_vis"]
        indices = Timeline.type_to_indices_mapping(timeline)

        return {
            "endTimestamp": format_timestamp(profile["data"]["endTimestamp"]),
            # Get groups formmated according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
            "groups": [
                {"id": idx, "content": grp} for idx, grp in enumerate(self.rules)
            ],
            "startTimestamp": format_timestamp(profile["data"]["startTimestamp"]),
            "events": self.get_events(timeline, indices, vis_prop),
        }

    ################### Timeline-vis functions ###################
    @staticmethod
    def _format_event_args(event):
        """
        Format the args within event which will be produced as HTML content in the frontend.
        """
        mapper = {
            "compile": lambda e: str(e["args"]["is cached"]),
            "runtime": lambda e: "Tensor " + e["args"]["tensor size"],
            "Epoch": lambda e: "epoch " + str(e["args"]["epoch_id"]),
        }

        if event["args"] is None or event["name"] not in mapper:
            return " "

        return mapper[event["name"]](event)

    @staticmethod
    def _add_range_events(start, end, idx, vis_prop, rules):
        """
        Utility to format the range events (i.e., with a start and end timestamp).
        TODO (surajk):
        1. Add documentation for the data.
        2. Combine the logic for the events - range and point.

        Format details:
        """
        return {
            "args": start["args"],
            "className": rules[start["_vis"]["group"]]["class_name"],
            "content": Timeline._format_event_args(start),
            "end": format_timestamp(end["ts"]),
            "group": vis_prop["group_to_idx"][start["_vis"]["group"]],
            "id": idx,
            "name": start["name"],
            "start": format_timestamp(start["ts"]),
            "pid": start["pid"],
            "tid": start["tid"],
            "type": start["_vis"]["type"],
        }

    @staticmethod
    def _add_point_events(event, idx, vis_prop, rules):
        """
        Utility to format the point events (i.e., with a start timestamp).
        TODO (surajk):
        1. Add documentation for the data.
        """
        return {
            "args": event["args"],
            # "className": rules[event["_vis"]["group"]]["class_name"],
            "content": Timeline._format_event_args(event),
            "group": vis_prop["group_to_idx"][event["_vis"]["group"]],
            "id": idx,
            "name": event["name"],
            "pid": event["pid"],
            "start": format_timestamp(event["ts"]),
            "tid": event["tid"],
            "type": event["_vis"]["type"],
        }

    def get_events(self, timeline, indices, vis_prop):
        """
        Get events formatted according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        TODO (surajk):
        1. Convert to staticmethod.
        """
        ret = []
        event_idx = 0

        # Add range-based events.
        range_event_indices = indices["range"]
        for _idx in range(0, len(range_event_indices) - 1, 2):
            s = timeline[range_event_indices[_idx]]
            e = timeline[range_event_indices[_idx + 1]]
            _event = Timeline._add_range_events(s, e, event_idx, vis_prop, self.rules)
            ret.append(_event)
            event_idx += 1

        # Add point-based events.
        point_event_indices = indices["point"]
        for _idx in point_event_indices:
            _e = timeline[point_event_indices[_idx]]
            _event = Timeline._add_point_events(_e, event_idx, vis_prop, self.rules)
            ret.append(_event)
            event_idx += 1

        # Add background events
        background_event_indices = indices["background"]
        for _idx in range(0, len(background_event_indices) - 1, 2):
            _s = timeline[background_event_indices[_idx]]
            _e = timeline[background_event_indices[_idx + 1]]
            _event = Timeline._add_range_events(_s, _e, event_idx, vis_prop, self.rules)
            ret.append(_event)
            event_idx += 1

        return ret

    ################### Summary-vis functions ###################
    def get_duration_plot(self, timeline, indices):
        """
        Get the runtimes for the range-based events.
        TODO (surajk): Generalize the point- and range-events indexing.
        """
        range_event_indices = indices["range"]

        bars = []
        for _idx in range(0, len(range_event_indices) - 1, 2):
            s = timeline[range_event_indices[_idx]]
            e = timeline[range_event_indices[_idx + 1]]
            bars.append({"duration": e["ts"] - s["ts"], "name": s["name"]})

        return {
            "data": bars,
            "min": np.min([_b["duration"] for _b in bars]).item(),
            "max": np.max([_b["duration"] for _b in bars]).item(),
        }
