import os
import json
import psutil
import functools
import pandas as pd


def get_memory_usage(process=None):
    """
    Utility to get the current process's memory usage.
    """
    if process is None:
        process = psutil.Process(os.getpid())

    bytes = float(process.memory_info().rss)

    if bytes < 1024.0:
        return f"{bytes} bytes"

    kb = bytes / 1024.0
    if kb < 1024.0:
        return f"{kb} KB"

    return f"{kb / 1024.} MB"


def create_dir_after_check(directory):
    """
    Utility to check if there is a directory in a path, if not create it.
    """
    if not os.path.exists(directory):
        os.makedirs(directory)


def get_sorted_files(path, sort_key=os.path.getmtime):
    """
    Utility to get the files in a path by
    """
    if not os.path.isabs(path):
        path = os.path.join(os.getcwd(), path)
    files = sorted([os.path.join(path, x) for x in os.listdir(path)], key=sort_key)
    return files


def get_latest_file(path):
    """
    Utility to get the latest file in a path.
    """
    if not os.path.isabs(path):
        path = os.path.join(os.getcwd(), path)
    files = sorted(
        [os.path.join(path, x) for x in os.listdir(path)], key=os.path.getmtime
    )
    return (files and files[-1]) or None


def remap_dict_of_list(mapper: dict):
    """
    Utility to remap the dict, values become keys.
    TODO: (surajk) Generalize the for loop - key, val
    """
    ret = {}
    for idx, key in enumerate(mapper):
        val = mapper[key]
        if type(val) == list:
            for v in val:
                ret[v] = key
        elif type(val) in [str, int, bool]:
            ret[val] = key
    return ret


def construct_mapper(obj: dict):
    """
    Construct mappers for key: val and val: key.
    """
    k2v = {idx: grp for idx, grp in enumerate(obj)}
    v2k = {grp: idx for idx, grp in enumerate(obj)}
    return v2k, k2v


def load_json(file_path) -> json:
    """
    Loads a timeline from a JSON file.
    TODO (surajk): Add validation for the chrome trace format.
    """
    with open(file_path, "r") as f:
        try:
            d = json.load(f)
        except ValueError as e:
            return None

    return d


def is_list_identical(list1, list2) -> bool:
    """
    Check if two list elements are identical.
    """
    return functools.reduce(
        lambda i, j: i and j, map(lambda m, k: m == k, list1, list2), True
    )


def format_timestamp(timestamp):
    return timestamp / 1000


def group_by_and_apply_sum(df, col):
    f = {col: "sum"}
    return df.groupby("name").agg(f).to_dict()


def combine_dicts_and_sum_values(dict_1, dict_2):
    return {
        key: dict_1.get(key, 0) + dict_2.get(key, 0)
        for key in set(dict_1) | set(dict_2)
    }
