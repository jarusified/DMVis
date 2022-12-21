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
                    "content": lambda e: "",
                },
                "compile": {
                    "regex": ["compile"],
                    "event_type": "range",
                    "content": lambda e: "",
                },
                "tracing": {
                    "regex": ["tracing"],
                    "event_type": "range",
                    "content": lambda e: "",
                },
                "Epoch": {
                    "regex": ["Epoch"],
                    "event_type": "background",
                    "content": lambda e: "",
                },
            },
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
                },
                "RT": {
                    "regex": ["RT_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                },
                "SN": {
                    "regex": ["SN_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                },
                "SAL": {
                    "regex": ["SAL_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                },
                "BUF": {
                    "regex": ["BUF_(\\w+)"],
                    "event_type": "range",
                    # "content": lambda e: "", #e["name"],
                },
            },
            "ordering": ["FE", "SN", "SAL", "BUF", "RT"],
        }

    def dmv(self) -> Dict:
        return {
            "grouping": {
                "DATA MOV": {
                    "regex": ["Mem(\\w+)"],
                    "event_type": "x-range",
                    "content": lambda e: e,  # str(e["memory bandwidth (GB/s)"]),
                },
                "CUDA": {
                    "regex": [
                        "cuda(\\w+)",
                    ],
                    "event_type": "x-range",
                    "content": lambda e: "",
                },
                "GPU_COMPUTE": {
                    "regex": [
                        "random_(\\w+)",
                        "gemm",
                        "void at::native",
                        "volta_dgemm",
                        "void computeBlockCounts",
                        "void compactK",
                        "void mfem::CuKernel1D",
                        "(\\w+)cuda_for_all(\\w+)"
                    ],
                    "event_type": "x-range",
                    "content": lambda e: "",
                },
                "CPU_COMPUTE": {
                    "regex": [
                        "fill_(\\w+)"
                    ],
                    "event_type": "x-range",
                    "content": lambda e: "",
                }
            },
            "ordering": ["CPU_COMPUTE", "GPU_COMPUTE", "CUDA", "DATA MOV"],
        }
