import {combineReducers} from 'redux';
import authReducer from './auth/slice';
import shiftReducer from './shift/slice';
import uiReducer from './ui/slice';
import outboxReducer from './outbox/slice';
import mapsReducer from './maps/slice';

const rootReducer = combineReducers({
  auth: authReducer,
  shift: shiftReducer,
  ui: uiReducer,
  outbox: outboxReducer,
  maps: mapsReducer,
});

export default rootReducer;
