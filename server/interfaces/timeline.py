import re
import json
import math
from tracemalloc import start
import numpy as np
from utils import get_logger

LOGGER = get_logger(__name__)

TIMELINE_TYPES = ["background", "point", "range"]
SLIDING_WINDOW = 1e7


class Timeline:
    def __init__(self, file_path):
        """
        Initializes a Timeline object.
        """

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
                "content": lambda e: "Tensor ", # + e["args"]["tensor size"],
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
                "content": lambda e: "epoch-" + str(e["args"]["epoch_id"]),
                "class_name": "compile",
            },
        }

        self.profile = self.load_profile(file_path=file_path)
        self.timeline = self.profile["data"]["traceEvents"]
        self.vis_prop = self.profile["_vis"]
        self.start_ts = Timeline.format_timestamp(
            self.profile["data"]["startTimestamp"]
        )
        self.end_ts = Timeline.format_timestamp(self.profile["data"]["endTimestamp"])

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

    def load_profile(self, file_path):
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

        return self.add_vis_fields(d)

    @staticmethod
    def combine_runtime_events(timelines):
        """
        Utility to combine the runtime performance timeline with JIT timeline.
        TODO (surajk): Evaluate how we will do this sub-group revealing.
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
    def type_to_indices_mapping(timeline, start_ts, end_ts):
        """
        Return the type: [0, 1, .... x] where x is the index in which the event of type (from TIMELINE_TYPES )
        """
        ret = {"point": [], "range": [], "background": []}
        for type in TIMELINE_TYPES:
            for idx, event in enumerate(timeline):
                event_ts = Timeline.format_timestamp(event['ts'])
                if event["_vis"]["type"] == type:
                    # if start_ts <= event_ts and event_ts <= end_ts:
                    ret[type].append({"idx": idx, "ph": event["ph"], "name": event["name"]})

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

    @staticmethod
    def format_timestamp(timestamp):
        return timestamp / 1000

    ################### Exposed APIs ###################
    def get_event_count(self):
        return len(self.timeline)

    def get_start_timestamp(self):
        return self.start_ts

    def get_end_timestamp(self):
        return self.end_ts

    def get_metadata(self, exp):
        return {
            "timelineStart": self.start_ts,
            "timelineEnd": self.end_ts,
            "selectedExperiment": exp,
        }

    def get_summary(self, sample_count=50):
        """
        returns the summary timeline based on timestamp sampling.
        """
        self.indices = Timeline.type_to_indices_mapping(self.timeline, self.start_ts, self.end_ts)
        range_event_indices = [ind['idx'] for ind in self.indices["range"]]

        ts_width = math.ceil((self.end_ts - self.start_ts) / sample_count)
        ts_samples = [
            math.ceil(sample)
            for sample in np.arange(self.start_ts, self.end_ts, ts_width)
        ]
        events_in_sample = {_s: {grp: 0 for grp in self.rules} for _s in ts_samples}

        for _idx in range(0, len(range_event_indices) - 1, 2):
            s = self.timeline[range_event_indices[_idx]]
            e = self.timeline[range_event_indices[_idx + 1]]

            s_ts = Timeline.format_timestamp(s["ts"])
            e_ts = Timeline.format_timestamp(e["ts"])
            group = s["_vis"]["group"]

            ts = np.array([s_ts, e_ts])
            dig = np.digitize(ts, ts_samples)

            if dig[0] == dig[1]:
                events_in_sample[ts_samples[dig[0] - 1]][group] += e_ts - s_ts
            else:
                _l = Timeline.format_timestamp(s["ts"])
                for i in range(dig[0], dig[1]):
                    events_in_sample[ts_samples[i - 1]][group] += ts_samples[i] - _l
                    _l = ts_samples[i]

                if i <= len(ts_samples) - 1:
                    events_in_sample[ts_samples[i]][group] += e_ts - ts_samples[i]

        for [sample, val] in events_in_sample.items():
            val["ts"] = sample

        return {
            "data": list(events_in_sample.values()),
            "end_ts": self.end_ts,
            "groups": list(self.rules.keys()),
            "samples": list(ts_samples),
            "start_ts": self.start_ts,
            "ts_width": ts_width,
            "window": Timeline.format_timestamp(SLIDING_WINDOW),
        }

    def get_timeline(self, window_start=None, window_end=None):
        """
        returns all the events in a given window. If a window is not provided, it will default to the start and end of a given timeline.
        """
        if not window_start:
            window_start = self.start_ts

        if not window_end:
            window_end = self.end_ts

        return {
            "end_ts": window_start,
            "events": self.get_events(window_start, window_end),
            # Get groups formmated according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
            "groups": [
                {"id": idx, "content": grp} for idx, grp in enumerate(self.rules)
            ],
            "start_ts": window_end,
        }

    ################### Timeline-vis functions ###################
    @staticmethod
    def _add_range_events(start, end, idx, vis_prop, rules):
        """
        Utility to format the range events (i.e., with a start and end timestamp).
        TODO (surajk):
        1. Add documentation for the data.
        2. Combine the logic for the events - range and point.

        Format details:
        """
        group = start["_vis"]["group"]
        return {
            "args": start["args"],
            "className": rules[group]["class_name"],
            "content": rules[group]["content"](start),
            "end": Timeline.format_timestamp(end["ts"]),
            "group": vis_prop["group_to_idx"][start["_vis"]["group"]],
            "id": idx,
            "name": start["name"],
            "start": Timeline.format_timestamp(start["ts"]),
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
        group = event["_vis"]["group"]
        return {
            "args": event["args"],
            # "className": rules[event["_vis"]["group"]]["class_name"],
            "content": rules[group]["content"](event),
            "group": vis_prop["group_to_idx"][event["_vis"]["group"]],
            "id": idx,
            "name": event["name"],
            "pid": event["pid"],
            "start": Timeline.format_timestamp(event["ts"]),
            "tid": event["tid"],
            "type": event["_vis"]["type"],
        }

    def get_events(self, window_start, window_end):
        """
        Get events formatted according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        TODO (surajk):
        1. Convert to staticmethod.
        """
        ret = []
        event_idx = 0

        self.indices = Timeline.type_to_indices_mapping(self.timeline, window_start, window_end)

        # Add range-based events.
        range_event_indices = [ind['idx'] for ind in self.indices["range"]]
        for _idx in range(0, len(range_event_indices) - 1, 2):
            s = self.timeline[range_event_indices[_idx]]
            e = self.timeline[range_event_indices[_idx + 1]]
            _event = Timeline._add_range_events(
                s, e, event_idx, self.vis_prop, self.rules
            )
            ret.append(_event)
            event_idx += 1

        # Add point-based events.
        point_event_indices = [ind['idx'] for ind in self.indices["point"]]
        for _idx in point_event_indices:
            _e = self.timeline[point_event_indices[_idx]]
            _event = Timeline._add_point_events(
                _e, event_idx, self.vis_prop, self.rules
            )
            ret.append(_event)
            event_idx += 1

        # Add background events
        background_event_indices = [ind['idx'] for ind in self.indices["background"]]
        for _idx in range(0, len(background_event_indices) - 1, 2):
            _s = self.timeline[background_event_indices[_idx]]
            _e = self.timeline[background_event_indices[_idx + 1]]
            _event = Timeline._add_range_events(
                _s, _e, event_idx, self.vis_prop, self.rules
            )
            ret.append(_event)
            event_idx += 1

        return ret
