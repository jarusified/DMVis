import os
from server.timeline import Timeline


def test_get_summary():
    TEST_DATA_FILE_PATH = "tests/duration_plot.json"

    t = Timeline(file_path=os.path.join(os.getcwd(), TEST_DATA_FILE_PATH))

    payload = t.get_summary(sample_count=10)
    events_in_sample = payload["data"]
    print(events_in_sample)
    assert all([sum(_v.values()) == 10.0 for [_k, _v] in events_in_sample.items()])

    payload = t.get_summary(sample_count=20)
    events_in_sample = payload["data"]
    assert all([sum(_v.values()) == 5.0 for [_k, _v] in events_in_sample.items()])
