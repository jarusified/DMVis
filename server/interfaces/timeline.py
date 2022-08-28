import os
import json
import numpy as np
from utils.time import format_timestamp
from utils.general import remap_dict_of_list
from logger import get_logger

LOGGER = get_logger(__name__)


class Timeline:
    def __init__(self, data_dir):
        """
        Initializes a Timeline object.
        # TODO (surajk): Create event_to_idx, group_to_idx.
        """
        LOGGER.info(f"{type(self).__name__} interface triggered.")
        self.experiments = os.listdir(data_dir)

        self.file_paths = {
            exp: os.path.join(os.path.abspath(data_dir), exp)
            for exp in self.experiments
        }

        self.event_to_types = {
            "point": [],
            "range": ["runtime", "compile", "tracing"],
            "background": ["Epoch"],
        }
        self.type_to_event = remap_dict_of_list(self.event_to_types)

        self.event_to_groups = {
            "runtime": ["runtime"],
            "compile": ["compile"],
            "tracing": ["tracing"],
            "Epoch": ["Epoch"],
        }
        self.group_to_event = remap_dict_of_list(self.event_to_groups)

        self.event_to_classes = {
            "runtime": "runtime",
            "compile": "compile",
            "tracing": "tracing",
            "Epoch": ["positive", "negative"],
        }
        self.range_events = ["runtime", "compile", "tracing"]
        self.point_events = []
        self.background_events = ["Epoch"]

        self.timelines = {
            exp: Timeline.load_timeline(self.file_paths[exp])
            for exp in self.experiments
        }

        LOGGER.info(f"Loaded {len(self.timelines)} timelines.")

    @staticmethod
    def load_timeline(file_path):
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

        return d

    ################### Exposed APIs ###################
    def sort_by_event_count(self):
        event_counts_dict = {exp: len(self.timelines[exp]) for exp in self.experiments}
        return list(
            dict(
                sorted(
                    event_counts_dict.items(), key=lambda item: item[1], reverse=True
                )
            ).keys()
        )

    def sort_by_date(self):
        event_counts_dict = {
            exp: self.timelines[exp]["data"]["startTimestamp"]
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

        d = self.timelines[exp]

        return {"bars": self.get_duration_plot(d["data"]["traceEvents"])}

    def get_timeline(self, exp):
        """
        Returns a timeline for a given experiment.
        """
        if exp not in self.experiments:
            return {}

        d = self.timelines[exp]

        return {
            "endTimestamp": format_timestamp(d["data"]["endTimestamp"]),
            "groups": self.get_groups(),
            "startTimestamp": format_timestamp(d["data"]["startTimestamp"]),
            "events": self.get_events(d["data"]["traceEvents"]),
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

    def _add_range_events(self, start, end, idx):
        """
        Utility to format the range events (i.e., with a start and end timestamp).
        TODO (surajk):
        1. Convert to staticmethod.
        2. Add documentation for the data.
        3. Combine the logic for the events - range, point and background.

        Format details:
        """
        return {
            "args": start["args"],
            "className": self.event_to_classes[start["name"]],
            "content": Timeline._format_event_args(start),
            "end": format_timestamp(end["ts"]),
            "group": self.group_index[self.group_to_event[start["name"]]],
            "id": idx,
            "name": start["name"],
            "start": format_timestamp(start["ts"]),
            "pid": start["pid"],
            "tid": start["tid"],
            "type": self.type_to_event[start["name"]],
        }

    def _add_point_events(self, event, idx):
        """
        Utility to format the point events (i.e., with a start timestamp).
        TODO (surajk):
        1. Convert to staticmethod.
        2. Add documentation for the data.
        """
        return {
            "args": event["args"],
            # "className": self.group_to_event[event["name"]],
            "content": Timeline._format_event_args(event),
            "group": self.group_index[self.group_to_event[event["name"]]],
            "id": idx,
            "name": event["name"],
            "pid": event["pid"],
            "start": format_timestamp(event["ts"]),
            "tid": event["tid"],
            "type": self.type_to_event[event["name"]],
        }

    def _add_background_events(self, start, end, idx):
        """
        Utility to format the background events (i.e., with a start timestamp).
        """
        return {
            "args": start["args"],
            "className": self.event_to_classes[start["name"]][
                start["args"]["epoch_id"] % 2
            ],
            "content": Timeline._format_event_args(start),
            "end": format_timestamp(end["ts"]),
            "group": self.group_index[self.group_to_event[start["name"]]],
            "id": idx,
            "name": start["name"],
            "pid": start["pid"],
            "start": format_timestamp(start["ts"]),
            "tid": start["tid"],
            "type": self.type_to_event[start["name"]],
        }

    def get_groups(self):
        """
        Get groups formmated according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        TODO (surajk):
        1. Convert to staticmethod.
        """
        self.group_index = {grp: idx for idx, grp in enumerate(self.event_to_groups)}
        return [
            {"id": self.group_index[grp], "content": grp}
            for idx, grp in enumerate(self.event_to_groups)
        ]

    def get_events(self, events):
        """
        Get events formatted according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        TODO (surajk):
        1. Convert to staticmethod.
        """
        ret = []
        event_idx = 0

        # Add range-based events.
        range_event_indices = [
            idx
            for idx, event in enumerate(events)
            if event["name"] in self.event_to_types["range"]
        ]
        for _idx in range(0, len(range_event_indices) - 1, 2):
            s = events[range_event_indices[_idx]]
            e = events[range_event_indices[_idx + 1]]
            _event = self._add_range_events(s, e, event_idx)
            ret.append(_event)
            event_idx += 1

        # Add point-based events.
        point_event_indices = [
            idx
            for idx, event in enumerate(events)
            if event["name"] in self.event_to_types["point"]
        ]
        for _idx in point_event_indices:
            _e = events[point_event_indices[_idx]]
            _event = self._add_point_events(_e, event_idx)
            ret.append(_event)
            event_idx += 1

        # Add background events
        background_event_indices = [
            idx
            for idx, event in enumerate(events)
            if event["name"] in self.event_to_types["background"]
        ]
        for _idx in range(0, len(background_event_indices) - 1, 2):
            _s = events[background_event_indices[_idx]]
            _e = events[background_event_indices[_idx + 1]]
            _event = self._add_background_events(_s, _e, event_idx)
            ret.append(_event)
            event_idx += 1

        return ret

    ################### Summary-vis functions ###################
    def get_duration_plot(self, events):
        """
        Get the runtimes for the range-based events.
        TODO (surajk): Generalize the point- and range-events indexing.
        """
        range_event_indices = [
            idx
            for idx, event in enumerate(events)
            if event["name"] in self.event_to_types["range"]
        ]
        # point_event_indices = [idx for idx, event in enumerate(events) if event["name"] in self.event_to_types["point"]]

        bars = []
        for _idx in range(0, len(range_event_indices) - 1, 2):
            s = events[range_event_indices[_idx]]
            e = events[range_event_indices[_idx + 1]]
            bars.append({"duration": e["ts"] - s["ts"], "name": s["name"]})

        return {
            "data": bars,
            "min": np.min([_b["duration"] for _b in bars]).item(),
            "max": np.max([_b["duration"] for _b in bars]).item(),
        }
