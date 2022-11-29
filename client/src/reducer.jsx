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
	UPDATE_TIMELINE_SUMMARY,
	UPDATE_WINDOW
} from "./helpers/types";

const initialState = {
	achievedOccupancy: 0,
	appState: false, // false is pause, true is play
	blockUtilization: 0,
	cct: {},
	cctLoaded: false,
	currentEventSummary: [],
	currentTimeline: {
		end_ts: 0,
		events: [],
		groups: [],
		start_ts: 0
	},
	currentTimelineSummary: [],
	dataDir: "",
	ensembleSummary: {},
	events: [],
	eventSummary: [],
	experiments: [],
	groups: [],
	individualSummary: {},
	isLoaded: false,
	metricTimeline: [],
	profileMetadata: [],
	selectedExperiment: "",
	sharedMemUtilization: 0,
	summary: {
		data: [],
		groups: 0,
		samples: [],
		ts_width: 0,
		window: 0
	},
	timelineEnd: 0,
	timelineStart: 0,
	timelineSummary: [],
	topology: "",
	windowStart: 0,
	windowEnd: 0,
	window: {}
};

export default function Reducer(state = initialState, action) {
	switch (action.type) {
		case FETCH_CCT:
			return {
				...state,
				cct: action.payload
			};
		case FETCH_EXPERIMENTS:
			return {
				...state,
				dataDir: action.payload.dataDir,
				experiments: action.payload.experiments
			};
		case FETCH_METADATA:
			return {
				...state,
				achievedOccupancy: action.payload.general.achievedOccupancy,
				selectedExperiment: action.payload.general.selectedExperiment,
				timelineStart: action.payload.general.timelineStart,
				timelineEnd: action.payload.general.timelineEnd,
				profileMetadata: action.payload.profile,
				sharedMemUtilization:
					action.payload.general.sharedMemUtilization,
				blockUtilization: action.payload.general.blockUtilization
			};
		case FETCH_METRIC_TIMELINE:
			return {
				...state,
				metricTimeline: action.payload
			};
		case FETCH_TIMELINE:
			return {
				...state,
				currentTimeline: action.payload
			};
		case FETCH_SUMMARY:
			return {
				...state,
				summary: action.payload
			};
		case FETCH_ENSEMBLE_SUMMARY:
			return {
				...state,
				ensembleSummary: action.payload.ensemble,
				individualSummary: action.payload.individual
			};
		case FETCH_EVENT_SUMMARY:
			return {
				...state,
				eventSummary: action.payload,
				currentEventSummary: action.payload
			};
		case FETCH_TIMELINE_SUMMARY:
			return {
				...state,
				timelineSummary: action.payload,
				currentTimelineSummary: action.payload
			};
		case FETCH_TOPOLOGY:
			return {
				...state,
				topology: action.payload
			};
		case FETCH_WINDOW:
			return {
				...state,
				window: action.payload
			};
		case LOAD_DATA_DIR:
			return {
				...state,
				isLoaded: action.payload
			};
		case UPDATE_APP_STATE:
			return {
				...state,
				appState: !state.appState
			};
		case UPDATE_TIMELINE_SUMMARY:
			return {
				...state,
				currentTimelineSummary: action.payload
			};
		case UPDATE_SELECTED_EXPERIMENT:
			return {
				...state,
				selectedExperiment: action.payload
			};
		case UPDATE_WINDOW:
			return {
				...state,
				windowStart: action.payload[0],
				windowEnd: action.payload[1]
			};
		case UPDATE_INDIVIDUAL_SUMMARY:
			return {
				...state,
				individualSummary: action.payload
			};
		default:
			return state;
	}
}
