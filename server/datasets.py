import os
import math
import random
import numpy as np
from typing import List, Dict
from glob import glob

from server.logger import get_logger
from server.timeline import Timeline

LOGGER = get_logger(__name__)


class Datasets:
    def __init__(self, data_dir: str, profile_format: str):
        """
        Dataset class for collecting the profiles from the input `data_dir`.
        """
        self.data_dir = data_dir
        self.ensemble = set(filename.split(".")[0].split("/")[-1] for filename in glob(f"{data_dir}/*.json"))

        self.traces = {
            exp: os.path.join(data_dir, exp) + ".json" for exp in self.ensemble
        }
        self.metrics = {
            exp: os.path.join(data_dir, exp) + ".csv" for exp in self.ensemble
        }

        self.topologies = {
            exp: os.path.join(data_dir, exp) + ".svg" for exp in self.ensemble
        }

        self.profiles = {
            exp: Timeline(self.metrics[exp], self.traces[exp], profile_format)
            for exp in self.ensemble
        }

        LOGGER.info(f"{len(self.ensemble)} JIT profiles loaded! ")
        LOGGER.info(f"=====================================")
        for name, profile in self.profiles.items():
            LOGGER.info(f"{name} contains {profile.get_event_count()} events. ")
        LOGGER.info(f"=====================================")

        self.get_summary()

    def get_all_profiles(self) -> Dict[str, Timeline]:
        """
        Returns the Timeline object for all experiments.

        :returns: Dictionary containing all the experiment timelines.
        """
        return self.profiles

    def get_profile(self, experiment: str) -> Timeline:
        """
        Returns the Timeline object for a given experiment.

        :params: experiment: Name of the experiment (aka JSON file name) with prefix (i.e., .json)
        :returns: Timeline object corresponding to the experiment.
        """
        if experiment not in self.profiles:
            LOGGER.error(
                f"Invalid {experiment}! Check if the experiment exists in {self.data_dir}"
            )
        return self.profiles[experiment]

    ################### Exposed APIs ###################
    def sort_by_event_count(self) -> List[str]:
        """
        Sorts the self.profiles based on number of events in the timeline.

        :params: None
        :returns: List of experiments
        """
        event_counts_dict = {
            exp: self.profiles[exp].get_event_count() for exp in self.ensemble
        }
        sorted_experiments = sorted(
            event_counts_dict.items(), key=lambda item: item[1], reverse=True
        )
        return list(dict(sorted_experiments).keys())

    def sort_by_date(self) -> List[str]:
        """
         Sorts the self.profiles by date of execution (i.e., timestamp).

        :params: None
         :returns: List of experiments
        """
        event_counts_dict = {
            exp: self.profiles[exp].get_start_timestamp() for exp in self.ensemble
        }
        sorted_experiments = sorted(
            event_counts_dict.items(), key=lambda item: item[1], reverse=True
        )
        return list(dict(sorted_experiments).keys())

    def max_min_runtime(self) -> List[float]:
        """
        Returns the max and min runtimes of the self.profiles .

        :params: None
         :returns: List[min, max]
        """
        dur_dict = {
            exp: self.profiles[exp].get_end_timestamp() - self.profiles[exp].get_start_timestamp() for exp in self.ensemble
        }
        return [min(dur_dict.values()), max(dur_dict.values())]


    def get_summary(self, sample_count=12) -> Dict:

        # Find the most expensive run.
        max_profile = None
        max_ts = 0
    
        for name in self.profiles:
            profile = self.profiles[name]
            ts = profile.end_ts - profile.start_ts
            if max_ts < ts:
                max_ts = ts
                max_profile = name

        # Set the sample vector.
        ts_width = math.ceil(max_ts / sample_count)

        max_profile_start_ts = 0
        max_profile_end_ts = max_ts
        ts_samples = [
            math.ceil(sample)
            for sample in np.arange(max_profile_start_ts, max_profile_end_ts, ts_width)
        ]

        ret = {}
        for name in self.profiles:
            profile = self.profiles[name]
            timeline = self.profiles[name].get_timeline()

            events_in_sample = {
                _s: {grp["content"]: 0 for grp in timeline["groups"]} for _s in ts_samples
            }

            for event in timeline["events"]:
                group = profile.idx_to_grp[event["group"]]

                ts = np.array([event["start"] - profile.start_ts, event["end"] - profile.start_ts])
                dig = np.digitize(ts, ts_samples)

                if dig[0] == dig[1]:
                    events_in_sample[ts_samples[dig[0] - 1]][group] += (
                        event["end"] - event["start"]
                    )
                else:
                    _l = 0
                    _h = event["end"] - event["start"]
                    for i in range(dig[0], dig[1]):
                        events_in_sample[ts_samples[i]][group] += ts_samples[i] - _l
                        _l = ts_samples[i]

                    if i < len(ts_samples) - 1:
                        events_in_sample[ts_samples[i]][group] += _h - ts_samples[i]

            max_ts = 0

            for [sample, val] in events_in_sample.items():
                max_ts = max(sum(val.values()), max_ts)
                val["ts"] = sample
            
            ret[name] = {
                "classNames": timeline["class_names"],
                "dmv": timeline["dmv"],
                "startTs": timeline["start_ts"],
                "endTs": timeline["end_ts"],
                "dur": timeline["end_ts"] - timeline["start_ts"],
                "xData": list(ts_samples),
                "yData": list(events_in_sample.values()),
                "zData": list(timeline["grouping"]),
                "maxY": max_ts,
                "ts_width": ts_width,
            }

        return ret
