import os
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

        self.profiles = {
            exp: Timeline(self.metrics[exp], self.traces[exp], profile_format)
            for exp in self.ensemble
        }

        LOGGER.info(f"{len(self.ensemble)} JIT profiles loaded! ")
        LOGGER.info(f"=====================================")
        for name, profile in self.profiles.items():
            LOGGER.info(f"{name} contains {profile.get_event_count()} events. ")
        LOGGER.info(f"=====================================")

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
