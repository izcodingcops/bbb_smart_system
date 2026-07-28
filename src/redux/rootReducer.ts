import {combineReducers} from 'redux';
import authReducer from './auth/slice';
import shiftReducer from './shift/slice';
import uiReducer from './ui/slice';

const rootReducer = combineReducers({
  auth: authReducer,
  shift: shiftReducer,
  ui: uiReducer,
});

export default rootReducer;
