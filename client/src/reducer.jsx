import moment from 'moment';
import {
    FETCH_EXPERIMENTS,
    FETCH_METADATA,
    FETCH_SUMMARY,
    FETCH_TIMELINE
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
        samples: 0,
        ts_width: 0,
        window: 0
    },
    timelineEnd: 0,
    timelineStart: 0
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
                selectedExperiment: action.payload.selectedExperiment,
                timelineStart: action.payload.timelineStart,
                timelineEnd: action.payload.timelineEnd
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
        default:
            return state;
    }
}