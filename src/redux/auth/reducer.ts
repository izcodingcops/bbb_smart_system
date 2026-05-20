import {UnknownAction} from 'redux';
import {AuthState} from '../../types/auth';
import {
  AUTH_LOGIN,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILURE,
  AUTH_LOGOUT,
  AUTH_LOGOUT_SUCCESS,
  AUTH_UPDATE_SESSION,
  AUTH_CLEAR_ERROR,
} from './types';

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

export default function authReducer(
  state: AuthState = initialState,
  action: UnknownAction,
): AuthState {
  switch (action.type) {
    case AUTH_LOGIN:
      return {...state, isLoading: true, error: null};

    case AUTH_LOGIN_SUCCESS: {
      const {user, session} = (action as any).payload;
      return {...state, isLoading: false, user, session, isAuthenticated: true};
    }

    case AUTH_LOGIN_FAILURE:
      return {...state, isLoading: false, error: (action as any).payload};

    case AUTH_LOGOUT:
      return {...state, isLoading: true};

    case AUTH_LOGOUT_SUCCESS:
      return {...initialState};

    case AUTH_UPDATE_SESSION:
      return {...state, session: (action as any).payload};

    case AUTH_CLEAR_ERROR:
      return {...state, error: null};

    default:
      return state;
  }
}
