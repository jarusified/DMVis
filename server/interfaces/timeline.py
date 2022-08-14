import os
import json
from utils.time import format_timestamp
from utils.general import remap_dict_of_list
from logger import get_logger

LOGGER = get_logger(__name__)

class Timeline():
    def __init__(self, data_dir):
        """
        Initializes a Timeline object.
        """
        LOGGER.info(f"{type(self).__name__} interface triggered.")
        self.experiments = os.listdir(data_dir)

        self.file_paths = {exp: os.path.join(os.path.abspath(data_dir), exp) for exp in self.experiments}

        self.event_to_groups = {
            "runtime": ["runtime"],
            "compile": ["compile"],
            "tracing": ["tracing", "tracing-start", "tracing-end", "already evaluated", "empty tensor"]
        }
        self.group_to_event = remap_dict_of_list(self.event_to_groups)
        self.point_events = ["already evaluated", "empty tensor"]
        self.class_names = {
            "tracing-start": "magenta",
            "tracing": "magenta",
            "runtime": "orange",
            "compile": "red",
            "tracing-end": "magenta"
        }

        self.timelines = {exp: self.load_timeline(self.file_paths[exp]) for exp in self.experiments}

        LOGGER.info(f"Loaded {len(self.timelines)} timelines.")

    @staticmethod
    def clean_address(d):
        return {k: v for k, v in d.items() if k != 'alloc.address'}

    def load_timeline(self, file_path):
        """
        Loads a timeline from a JSON file.
        """
        with open(file_path, 'r') as f:
            d = json.load(f)            
            
        return { 
            "endTimestamp": format_timestamp(d["data"]["endTimestamp"]),
            "groups": self.get_groups(),
            "startTimestamp": format_timestamp(d["data"]["startTimestamp"]),
            "events": self.get_events(d["data"]["traceEvents"])

        }

    def sort_by_event_count(self):
        event_counts_dict = { exp: len(self.timelines[exp]) for exp in self.experiments }
        return list(dict(sorted(event_counts_dict.items(), key=lambda item: item[1], reverse=True)).keys())

    def get_timeline(self, exp):
        """
        Returns a timeline for a given experiment.
        """
        return self.timelines[exp] if exp in self.experiments else None

    @staticmethod
    def _format_event_args(event):
        if event["name"] == "compile":
            return str(event["args"]["is cached"])
        elif event["name"] == "runtime":
            return "Tensor" + event["args"]["tensor size"]

    def _add_range_events(self, start, end, idx):
        """
        Utility to format the range-based events (i.e., with a start and end timestamp). 

        Format details: 
        """
        return {
            "args": start["args"],
            "name": start["name"],
            "className": self.class_names[start["name"]],
            "content": Timeline._format_event_args(start) if start["args"] is not None else "",
            "group": start["name"],
            "end": format_timestamp(end["ts"]),
            "id": idx,
            "start": format_timestamp(start["ts"]),
            "pid": start["pid"],
            "tid": start["tid"],
            "group": self.group_index[self.group_to_event[start["name"]]]
        }

    def _add_point_events(self, event, idx):
        """
        Utility to format the point-based events (i.e., with a start timestamp).
        """
        return {
            "args": event["args"],
            "name": event["name"],
            "type": "point",
            # "className": class_names[_e["name"]],
            # "content": event["name"],
            "id": idx,
            "pid": event["pid"],
            "start": format_timestamp(event["ts"]),
            "tid": event["tid"],
            "group": self.group_index[self.group_to_event[event["name"]]]
        }

    def get_groups(self):
        """
        Get groups formmated according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        """
        self.group_index = {grp: idx for idx, grp in enumerate(self.event_to_groups)}
        return [{"id": self.group_index[grp], "content": grp }for idx, grp in enumerate(self.event_to_groups)]

    def get_events(self, events):
        """
        Get events formatted according to vis-timeline format (For further information, refer https://github.com/visjs/vis-timeline).
        """
        indices = [idx for idx, event in enumerate(events) if event["name"] not in self.point_events]
        non_indices = [idx for idx, event in enumerate(events) if event["name"] in self.point_events]
        
        ret = []
        event_idx = 0
        for _idx in range(0, len(indices) - 1, 2):
            s = events[indices[_idx]]
            e = events[indices[_idx + 1]]
            _event = self._add_range_events(s, e, event_idx)
            ret.append(_event)
            event_idx += 1

        for _idx in non_indices:
            _e = events[_idx]
            _event = self._add_point_events(_e, event_idx)
            ret.append(_event)
            event_idx += 1
            
        return ret