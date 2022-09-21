import os
import pytest
from pyinstrument import Profiler

from server.timeline import Timeline

DIRECTORIES = {
    "JIT": "example_data/jit",
    "SNPROF": "example_data/snprof",
    "KINETO": "example_data/kineto"
}

def test_runtimes():
    for format, directory in DIRECTORIES.items():
        for path in os.listdir(directory):
            file_path = os.path.abspath(os.path.join(directory, path))

            print(file_path)

            p = Profiler()
            p.start()
            t = Timeline(file_path, format)
            p.stop()

            text_output = p.output_text()
            print(text_output)
