import {combineReducers} from 'redux';
import authReducer from './auth/reducer';
import programReducer from './program/reducer';
import navigationReducer from './navigation/reducer';

const rootReducer = combineReducers({
  auth: authReducer,
  program: programReducer,
  navigation: navigationReducer,
});

export default rootReducer;
