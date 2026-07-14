import {combineReducers} from 'redux';
import authReducer from './auth/slice';
import shiftReducer from './shift/slice';
import uiReducer from './ui/slice';
import {apiSlice} from './api/apiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  shift: shiftReducer,
  ui: uiReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

export default rootReducer;
