import {
	FETCH_CCT,
	FETCH_ENSEMBLE_SUMMARY,
	FETCH_EVENT_SUMMARY,
	FETCH_EXPERIMENTS,
	FETCH_METADATA,
	FETCH_METRIC_TIMELINE,
	FETCH_SUMMARY,
	FETCH_TIMELINE,
	FETCH_TIMELINE_SUMMARY,
	FETCH_TOPOLOGY,
	FETCH_WINDOW,
	LOAD_DATA_DIR,
	UPDATE_APP_STATE,
	UPDATE_INDIVIDUAL_SUMMARY,
	UPDATE_SELECTED_EXPERIMENT,
	UPDATE_WINDOW
} from "./helpers/types";

const SERVER_URL = "http://localhost:5000";

async function POSTWrapper(url_path, json_data) {
	const request_context = {
		// credentials: 'include',
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(json_data),
		mode: "cors"
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
		mode: "cors"
	};

	const response = await fetch(`${SERVER_URL}/${url_path}`, request_context);
	const data = await response.json();
	return data;
}

export const loadExample = (example) => async (dispatch) => {
	const isLoaded = await POSTWrapper("load_example", {"example": example});
	dispatch({
		type: LOAD_DATA_DIR,
		payload: isLoaded
	})
}

export const fetchExperiments = () => async (dispatch) => {
	const data = await GETWrapper("fetch_experiments");
	dispatch({
		type: FETCH_EXPERIMENTS,
		payload: data
	});
};

export const fetchSummary = (sample_count) => async (dispatch) => {
	const data = await POSTWrapper("fetch_summary", {
		sample_count: sample_count
	});
	dispatch({
		type: FETCH_SUMMARY,
		payload: data
	});
};

export const fetchTimeline = (window_start, window_end) => async (dispatch) => {
	const data = await POSTWrapper("fetch_timeline", {
		window_start: window_start,
		window_end: window_end
	});
	dispatch({
		type: FETCH_TIMELINE,
		payload: data
	});
};

export const fetchMetadata = (exp) => async (dispatch) => {
	const metadata = await POSTWrapper("set_experiment", { experiment: exp });
	dispatch({
		type: FETCH_METADATA,
		payload: metadata
	});
};

export const fetchEventSummary = (groups) => async (dispatch) => {
	const eventSummary = await POSTWrapper("fetch_event_summary", {
		groups: groups
	});
	dispatch({
		type: FETCH_EVENT_SUMMARY,
		payload: eventSummary
	});
};

export const fetchTimelineSummary = () => async (dispatch) => {
	const timelineSummary = await GETWrapper("fetch_timeline_summary");
	dispatch({
		type: FETCH_TIMELINE_SUMMARY,
		payload: timelineSummary
	});
};

export const fetchEnsembleSummary = () => async (dispatch) => {
	const ensembleSummary = await POSTWrapper("fetch_ensemble_summary");
	dispatch({
		type: FETCH_ENSEMBLE_SUMMARY,
		payload: ensembleSummary
	});
};

export const fetchWindow = (window_start, window_end) => async (dispatch) => {
	const window = await POSTWrapper("fetch_window", {window_start: window_start, window_end: window_end });
	dispatch({
		type: FETCH_WINDOW,
		payload: window
	});
};

export const fetchMetricTimeline = () => async (dispatch) => {
	const metric_timeline = await POSTWrapper("fetch_metrics_timeline", {});
	dispatch({
		type: FETCH_METRIC_TIMELINE,
		payload: metric_timeline
	});
};

export const updateAppState = () => async (dispatch) => {
	dispatch({
		type: UPDATE_APP_STATE,
	});
};

export const updateSelectedExperiment = (exp) => async (dispatch) => {
	dispatch({
		type: UPDATE_SELECTED_EXPERIMENT,
		payload: exp
	});
};

export const updateWindow = (windowStart, windowEnd) => async (dispatch) => {
	dispatch({
		type: UPDATE_WINDOW,
		payload: [windowStart, windowEnd]
	});
};

export const updateIndividualSummary = (sorted) => async (dispatch) => {
	dispatch({
		type: UPDATE_INDIVIDUAL_SUMMARY,
		payload: sorted
	})
}

export const fetchTopology = () => async (dispatch) => {
	const request_context = {
		method: "GET",
		headers: { "Content-Type": "application/svg" },
		mode: "cors"
	};
	const response = await fetch(
		`${SERVER_URL}/static/topology.svg`,
		request_context
	);
	const text = await response.text();

	dispatch({
		type: FETCH_TOPOLOGY,
		payload: text
	});
};

export const fetchCCT = () => async (dispatch) => {
	const cct = await GETWrapper("fetch_cct");
	dispatch({
		type: FETCH_CCT,
		payload: cct
	});
};
