import os
import psutil


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
    return {grp: idx for idx, grp in enumerate(obj)}, {
        idx: grp for idx, grp in enumerate(obj)
    }
