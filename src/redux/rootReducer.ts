import {combineReducers} from 'redux';
import authReducer from './auth/reducer';
import programReducer from './program/reducer';
import navigationReducer from './navigation/reducer';
import locationReducer from './location/reducer';

const rootReducer = combineReducers({
  auth: authReducer,
  program: programReducer,
  navigation: navigationReducer,
  location: locationReducer,
});

export default rootReducer;
