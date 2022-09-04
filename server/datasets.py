import os

from server.logger import get_logger
from server.timeline import Timeline

LOGGER = get_logger(__name__)


class Datasets:
    def __init__(self, data_dir):
        """
        Dataset class for collecting the profiles from the input `data_dir`.
        """
        LOGGER.info(f"{type(self).__name__} interface triggered.")
        self.experiments = os.listdir(data_dir)

        self.file_paths = {
            exp: os.path.join(os.path.abspath(data_dir), exp)
            for exp in self.experiments
        }
        self.profiles = {
            exp: Timeline(self.file_paths[exp]) for exp in self.experiments
        }

        LOGGER.info(f"Loaded {len(self.profiles)} profiles.")
        LOGGER.info(f"=====================================")
        for name, profile in self.profiles.items():
            LOGGER.info(f"{name} ({profile.get_event_count()} events) - ")
        LOGGER.info(f"=====================================")

    def get_profile(self, experiment) -> Timeline:
        if experiment in self.profiles:
            return self.profiles[experiment]

    ################### Exposed APIs ###################
    def sort_by_event_count(self):
        event_counts_dict = {
            exp: self.profiles[exp].get_event_count() for exp in self.experiments
        }
        return list(
            dict(
                sorted(
                    event_counts_dict.items(), key=lambda item: item[1], reverse=True
                )
            ).keys()
        )

    def sort_by_date(self):
        event_counts_dict = {
            exp: self.profiles[exp].get_start_timestamp() for exp in self.experiments
        }
        return list(
            dict(
                sorted(
                    event_counts_dict.items(), key=lambda item: item[1], reverse=True
                )
            ).keys()
        )
