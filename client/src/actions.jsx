import { FETCH_BACKGROUND_SUMMARY, FETCH_EVENT_SUMMARY, FETCH_EXPERIMENTS, FETCH_SUMMARY, FETCH_TIMELINE, FETCH_METADATA } from "./helpers/types";
const SERVER_URL = "http://localhost:5000";

async function POSTWrapper(url_path, json_data) {
  const request_context = {
    // credentials: 'include',
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json_data),
    mode: 'cors'
  };

  const response = await fetch(`${SERVER_URL}/${url_path}`, request_context);
  const data = await response.json();
  return data;
}

async function GETWrapper(url_path) {
  const request_context = {
    // credentials: 'include',
    method: "GET",
    headers: { "Content-Type": "application/json" },
    mode: 'cors'
  };

  const response = await fetch(`${SERVER_URL}/${url_path}`, request_context);
  const data = await response.json();
  return data;
}

export const fetchExperiments = () => async (dispatch) => {
  const data = await GETWrapper("fetch_experiments");
  dispatch({
    type: FETCH_EXPERIMENTS,
    payload: data,
  });
};

export const fetchSummary = (experiment_tag) => async (dispatch) => {
  const data = await POSTWrapper("fetch_summary", { experiment: experiment_tag });
  dispatch({
    type: FETCH_SUMMARY,
    payload: data,
  });
};

export const fetchTimeline = (window_start, window_end) => async (dispatch) => {
  const data = await POSTWrapper("fetch_timeline", { window_start: window_start, window_end: window_end });
  dispatch({
    type: FETCH_TIMELINE,
    payload: data,
  });
};

export const fetchMetadata = (exp) => async (dispatch) => {
  const metadata = await POSTWrapper("set_experiment", { experiment: exp });
  dispatch({
    type: FETCH_METADATA,
    payload: metadata,
  });
};

export const fetchEventSummary = () => async (dispatch) => {
  const eventSummary = await GETWrapper("fetch_event_summary")
  dispatch({
    type: FETCH_EVENT_SUMMARY,
    payload: eventSummary
  })
}

export const fetchBackgroundSummary = () => async (dispatch) => {
  const backgroundSummary = await GETWrapper("fetch_background_summary")
  dispatch({
    type: FETCH_BACKGROUND_SUMMARY,
    payload: backgroundSummary
  })
}