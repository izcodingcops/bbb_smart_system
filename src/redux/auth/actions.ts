import {LoginCredentials, User, Session} from '../../types/auth';
import {
  AUTH_LOGIN,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILURE,
  AUTH_LOGOUT,
  AUTH_LOGOUT_SUCCESS,
  AUTH_CLEAR_ERROR,
} from './types';

export const login = (credentials: LoginCredentials) => ({
  type: AUTH_LOGIN as typeof AUTH_LOGIN,
  payload: credentials,
});

export const loginSuccess = (data: {user: User; session: Session}) => ({
  type: AUTH_LOGIN_SUCCESS as typeof AUTH_LOGIN_SUCCESS,
  payload: data,
});

export const loginFailure = (error: string) => ({
  type: AUTH_LOGIN_FAILURE as typeof AUTH_LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({
  type: AUTH_LOGOUT as typeof AUTH_LOGOUT,
});

export const logoutSuccess = () => ({
  type: AUTH_LOGOUT_SUCCESS as typeof AUTH_LOGOUT_SUCCESS,
});

export const clearError = () => ({
  type: AUTH_CLEAR_ERROR as typeof AUTH_CLEAR_ERROR,
});

export type AuthAction =
  | ReturnType<typeof login>
  | ReturnType<typeof loginSuccess>
  | ReturnType<typeof loginFailure>
  | ReturnType<typeof logout>
  | ReturnType<typeof logoutSuccess>
  | ReturnType<typeof clearError>;
