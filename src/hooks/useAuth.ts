import {useCallback} from 'react';
import {useAppDispatch} from '../redux/store';
import {login, logout, clearError} from '../redux/auth/slice';
import {LoginCredentials} from '../types/auth';
import {GetUser, GetSession, GetIsAuthenticated, GetAuthLoading, GetAuthError} from '../redux/selectors';

export const useAuth = () => {
  const dispatch = useAppDispatch();

  const user = GetUser();
  const session = GetSession();
  const isLoading = GetAuthLoading();
  const error = GetAuthError();
  const isAuthenticated = GetIsAuthenticated();

  const doLogin = useCallback(
    (credentials: LoginCredentials) => dispatch(login(credentials)),
    [dispatch],
  );

  const doLogout = useCallback(() => dispatch(logout()), [dispatch]);

  const dismissError = useCallback(() => dispatch(clearError()), [dispatch]);

  return {
    user,
    session,
    isLoading,
    error,
    isAuthenticated,
    login: doLogin,
    logout: doLogout,
    dismissError,
  };
};
