import { 
    FETCH_EXPERIMENTS, 
    FETCH_TIMELINE, 
    UPDATE_EXPERIMENT
} from './helpers/types';

const initialState = {
    experiments: [],
    selected_experiment: '',
    timeline: {}
};

export default function Reducer(state=initialState, action){
    switch (action.type) {
        case FETCH_EXPERIMENTS:
            return {
                ...state,
                experiments: action.payload.experiments,
                selected_experiment: action.payload.experiments[0],
            }
        case UPDATE_EXPERIMENT:
            return {
                ...state,
                selected_experiment: action.payload,
            }
        case FETCH_TIMELINE:
            return {
                ...state,
                timeline: action.payload,
            }
        default:
            return state;
    }
}