import {combineReducers} from 'redux';
import authReducer from './auth/reducer';
import programReducer from './program/reducer';
import navigationReducer from './navigation/reducer';
import locationReducer from './location/reducer';
import offlineQueueReducer from './offlineQueue/reducer';

const rootReducer = combineReducers({
  auth: authReducer,
  program: programReducer,
  navigation: navigationReducer,
  location: locationReducer,
  offlineQueue: offlineQueueReducer,
});

export default rootReducer;
