import os
import pytest

from server.timeline import Timeline

TEST_LOGREG_PATH = "example_data/gm/gm__jit_logreg_multi_epoch_training_test_run-787457eb8d16bde2fb6623b00ca2d10d53eb0750.json"
TEST_ADDBMM_PATH = "example_data/gm/gm__jit_addition_bmm_simple_annotation_test_run-787457eb8d16bde2fb6623b00ca2d10d53eb0750.json"
TEST_SUMMARY_PATH = "tests/summary.json"

VIS_COLUMNS = ["group", "type", "content"]


@pytest.fixture
def logregT():
    return Timeline(file_path=os.path.join(os.getcwd(), TEST_LOGREG_PATH), profile_format="JIT")


@pytest.fixture
def summaryT():
    return Timeline(file_path=os.path.join(os.getcwd(), TEST_SUMMARY_PATH), profile_format="JIT")


@pytest.fixture
def addbmmT():
    return Timeline(file_path=os.path.join(os.getcwd(), TEST_ADDBMM_PATH), profile_format="JIT")


def test_addbmm(addbmmT):
    assert (len(addbmmT.timeline)) == 8

    keys = list(addbmmT.timeline[0].keys())
    keys.remove("args")  # We do not add `args` field, so we remove the key.

    # Check if all the columns after processsing is tracked by the timeline_df.
    all_columns = keys + VIS_COLUMNS
    assert all_columns == addbmmT.timeline_df.columns.tolist()

    # Check if all types in the dataframe are tracked by the grp_timeline_df.
    assert set(list(addbmmT.grp_df_dict.keys())) == set(
        addbmmT.timeline_df["type"].unique().tolist()
    )

    # Check if all sub_groups in the dataframe are tracked.
    sub_groups = [grp for grp in addbmmT.rules["grouping"] if "sub_groups" in addbmmT.rules["grouping"][grp]]
    assert set(list(addbmmT.sub_grp_df_dict.keys())) == set(sub_groups)

    # Check the number of rt contexts in `sub_grp_timeline_df`
    assert len(list(addbmmT.sub_grp_df_dict["runtime"]["rt_id"].unique().tolist())) == 1


def test_logreg(logregT):
    assert (len(logregT.timeline)) == 56

    keys = list(logregT.timeline[0].keys())
    keys.remove("args")  # We do not add `args` field, so we remove the key.

    # Check if all the columns after processsing is tracked by the timeline_df.
    all_columns = keys + VIS_COLUMNS
    assert all_columns == logregT.timeline_df.columns.tolist()

    # Check if all types in the dataframe are tracked by the grp_timeline_df.
    assert set(list(logregT.grp_df_dict.keys())) == set(
        logregT.timeline_df["type"].unique().tolist()
    )

    # Check if all sub_groups in the dataframe are tracked.
    sub_groups = [grp for grp in logregT.rules["grouping"] if "sub_groups" in logregT.rules["grouping"][grp]]
    assert set(list(logregT.sub_grp_df_dict.keys())) == set(sub_groups)

    # Check the number of rt contexts in `sub_grp_timeline_df`
    assert len(list(logregT.sub_grp_df_dict["runtime"]["rt_id"].unique().tolist())) == 9


# def test_get_summary(summaryT):
#     payload = summaryT.get_summary(sample_count=10)
#     events_in_sample = payload["data"]
#     assert all([sum(_v.values()) == 10.0 for [_k, _v] in events_in_sample.items()])

#     payload = summaryT.get_summary(sample_count=20)
#     events_in_sample = payload["data"]
#     assert all([sum(_v.values()) == 5.0 for [_k, _v] in events_in_sample.items()])
