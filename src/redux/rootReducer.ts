import {combineReducers} from 'redux';
import authReducer from './auth/reducer';
import programReducer from './program/reducer';
import locationReducer from './location/slice';
import offlineQueueReducer from './offlineQueue/reducer';
import maintenanceReducer from './maintenance/reducer';
import {apiSlice} from './api/apiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  program: programReducer,
  location: locationReducer,
  offlineQueue: offlineQueueReducer,
  maintenance: maintenanceReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

export default rootReducer;
