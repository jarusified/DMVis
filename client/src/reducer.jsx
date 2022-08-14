import moment from 'moment';
import { 
    FETCH_EXPERIMENTS, 
    FETCH_TIMELINE, 
    UPDATE_EXPERIMENT
} from './helpers/types';

const initialState = {
    endTimestamp: 0,
    experiments: [],
    events: [],
    groups: [],
    selectedExperiment: '',
    startTimestamp: 0
};

export default function Reducer(state=initialState, action){
    switch (action.type) {
        case FETCH_EXPERIMENTS:
            return {
                ...state,
                experiments: action.payload.experiments,
                selectedExperiment: action.payload.experiments[0],
            }
        case UPDATE_EXPERIMENT:
            return {
                ...state,
                selectedExperiment: action.payload,
            }
        case FETCH_TIMELINE:
            return {
                ...state,
                events: action.payload.events,
                groups: action.payload.groups,
                startTimestamp: moment(action.payload.startTimestamp),
                endTimestamp: moment(action.payload.endTimestamp)
            }
        default:
            return state;
    }
}