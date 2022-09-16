from os import stat
from typing import Dict

from server.logger import get_logger

LOGGER = get_logger(__name__)


class Rules:
    """
    Class to define the rules for supported timeline formats

    Format : {
        "event_group": {
            "event_names": List, // Required
            "event_type": Str, // Optional: "point" | "range" | "background" - By default, if an event has `start` and `end` timestamp, we will
        }, ... }
    """

    def __init__(self) -> None:
        pass

    def validate(self) -> bool:
        """
        TODO: Add validation and tests for the `self.rules`.
        https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/22
        """
        pass

    def jit(self) -> Dict:
        return {
            "grouping": {
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
                    "nested_event": "traceEvents",
                    "sub_groups": {
                        "data": "traceEvents",
                        "name": "snprof",
                        "content": lambda e: e["name"],
                    },
                    "class_name": "runtime",
                    "content": lambda e: "",
                },
                "compile": {
                    "regex": ["compile"],
                    "event_type": "range",
                    "class_name": "compile",
                    "content": lambda e: "",
                },
                "tracing": {
                    "regex": ["tracing"],
                    "event_type": "range",
                    "class_name": "tracing",
                    "content": lambda e: "",
                },
                "Epoch": {
                    "regex": ["Epoch"],
                    "event_type": "background",
                    "class_name": "epoch",
                    "content": lambda e: "",
                },
            },
            # TODO: This should be its own function.
            # https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/22
            "ordering": ["tracing", "compile", "runtime", "snprof", "Epoch"],
        }

    def snprof(self) -> Dict:
        return {
            "grouping": {
                "FE": {
                    "regex": [
                        "FE_(\\w+)",
                    ],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                    "class_name": "runtime",
                },
                "RT": {
                    "regex": ["RT_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                    "class_name": "runtime",
                },
                "SN": {
                    "regex": ["SN_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                    "class_name": "runtime",
                },
                "SAL": {
                    "regex": ["SAL_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                    "class_name": "runtime",
                },
                "BUF": {
                    "regex": ["BUF_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                    "class_name": "runtime",
                },
            },
            "ordering": ["FE", "SN", "SAL", "BUF", "RT"],
        }
