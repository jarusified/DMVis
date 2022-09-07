import {
    FETCH_EXPERIMENTS,
    FETCH_METADATA,
    FETCH_SUMMARY,
    FETCH_TIMELINE,
    FETCH_EVENT_SUMMARY
} from './helpers/types';

const initialState = {
    currentTimeline: {
        end_ts: 0,
        events: [],
        groups: [],
        start_ts: 0
    },
    experiments: [],
    events: [],
    groups: [],
    selectedExperiment: '',
    summary: {
        data: [],
        groups: 0,
        samples: [],
        ts_width: 0,
        window: 0
    },
    eventSummary: [],
    timelineEnd: 0,
    timelineStart: 0,
    profileMetadata: []
};

export default function Reducer(state = initialState, action) {
    switch (action.type) {
        case FETCH_EXPERIMENTS:
            return {
                ...state,
                experiments: action.payload.experiments,
                selectedExperiment: action.payload.experiments[0],
            }
        case FETCH_METADATA:
            return {
                ...state,
                selectedExperiment: action.payload.general.selectedExperiment,
                timelineStart: action.payload.general.timelineStart,
                timelineEnd: action.payload.general.timelineEnd,
                profileMetadata: action.payload.profile
            }
        case FETCH_TIMELINE:
            return {
                ...state,
                currentTimeline: action.payload,
            }
        case FETCH_SUMMARY:
            return {
                ...state,
                summary: action.payload
            }
        case FETCH_EVENT_SUMMARY:
            return {
                ...state,
                eventSummary: action.payload
            }
        default:
            return state;
    }
}