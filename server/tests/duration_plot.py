import os
from server.interfaces import Timeline

TEST_DATA_FILE_PATH = "tests/duration_plot.json"


def test_sampling():
    t = Timeline(file_path=os.path.join(os.getcwd(), TEST_DATA_FILE_PATH))
    events_in_sample = t.get_duration_plot(sample_count=10)

    assert all([sum(_v.values()) == 10.0 for [_k, _v] in events_in_sample.items()])

    events_in_sample = t.get_duration_plot(sample_count=20)
    assert all([sum(_v.values()) for [_k, _v] in events_in_sample.items()])
