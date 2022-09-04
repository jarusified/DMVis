from json import load
import os
from server.datasets import Datasets
from server.timeline import Timeline
from server.utils import load_profile, is_list_identical

TEST_FOLDER = "example_data/gm"


def test_construct():
    d = Datasets(data_dir=TEST_FOLDER)

    # Check if the number of profiles in the directory is 6.
    assert len(d.profiles) == 6

    # Check if all files are loaded from the given directory.
    assert len(os.listdir(TEST_FOLDER)) == len(d.profiles.keys())


def test_get_profile():
    d = Datasets(data_dir=TEST_FOLDER)

    assert all(
        type(d.get_profile(filename)) == Timeline
        for filename in os.listdir(TEST_FOLDER)
    )


def test_sort_by_event_count():
    d = Datasets(data_dir=TEST_FOLDER)
    sorted_datasets = d.sort_by_event_count()

    json = {}
    for filename in os.listdir(TEST_FOLDER):
        path = os.path.join(os.path.abspath(TEST_FOLDER), filename)
        events = load_profile(path)

        json[filename] = len(events["data"]["traceEvents"])

    check_sorted_datasets = list(
        dict(sorted(json.items(), key=lambda item: item[1], reverse=True)).keys()
    )

    assert is_list_identical(sorted_datasets, check_sorted_datasets)


def test_sort_by_timestamp():
    d = Datasets(data_dir=TEST_FOLDER)
    sorted_datasets = d.sort_by_date()

    json = {}
    for filename in os.listdir(TEST_FOLDER):
        path = os.path.join(os.path.abspath(TEST_FOLDER), filename)
        events = load_profile(path)

        json[filename] = events["data"]["startTimestamp"]

    check_sorted_datasets = list(
        dict(sorted(json.items(), key=lambda item: item[1], reverse=True)).keys()
    )

    assert is_list_identical(sorted_datasets, check_sorted_datasets)
