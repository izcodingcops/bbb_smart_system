import {UPDATE_LOCATION, LocationState} from './types';

const initialState: LocationState = {
  currentLocation: null,
};

const locationReducer = (state = initialState, action: any): LocationState => {
  switch (action.type) {
    case UPDATE_LOCATION:
      return {...state, currentLocation: action.payload};
    default:
      return state;
  }
};

export default locationReducer;
