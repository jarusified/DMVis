import os
import json
from logger import get_logger
from datetime import datetime

LOGGER = get_logger(__name__)

class Timeline():
    def __init__(self, data_dir):
        """
        Initializes a Timeline object.
        """
        LOGGER.info(f"{type(self).__name__} interface triggered.")
        self.experiments = os.listdir(data_dir)
        self.file_paths = {exp: os.path.join(os.path.abspath(data_dir), exp) for exp in self.experiments}
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
            traceEvents = self.post_process(d["data"]["traceEvents"])
            
        return { "traceEvents": traceEvents, "startTimestamp": d["data"]["traceEvents"][0]["ts"]/1000 }

    def sort_by_event_count(self):
        event_counts_dict = { exp: len(self.timelines[exp]) for exp in self.experiments }
        return list(dict(sorted(event_counts_dict.items(), key=lambda item: item[1], reverse=False)).keys())

    def get_timeline(self, exp):
        """
        Returns a timeline for a given experiment.
        """
        return self.timelines[exp] if exp in self.experiments else None

    def post_process(self, events):
        controlled_events = ["already evaluated", "empty tensor"]
        indices = [idx for idx, event in enumerate(events) if event["name"] not in controlled_events]
        non_indices =  [idx for idx, event in enumerate(events) if event["name"] in controlled_events]
        
        ret = []
        event_idx = 0
        for _idx in range(0, len(indices) - 1, 2):
            s = events[indices[_idx]]
            e = events[indices[_idx + 1]]
            
            # assert(s["name"] == e["name"])
            _event = {
                # "args": s["args"],
                "content": s["name"],
                "start": s["ts"]/1000,
                "end": e["ts"]/1000,
                "pid": s["pid"],
                "tid": s["tid"],
                "id": event_idx
            }
            event_idx += 1
            
            ret.append(_event)
            
        for _idx in non_indices:
            _e = events[_idx]
            _event = {
                "args": _e["args"],
                "content": _e["name"],
                "start": _e["ts"]/1000,
                "end": _e["ts"]/1000,
                "pid": _e["pid"],
                "tid": _e["tid"],
                "id": event_idx
            }
            event_idx += 1
            ret.append(_event)
            
        return ret