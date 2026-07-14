import {useSelector} from 'react-redux';
import {RootState} from '../store';

export const GetUser = () =>
  useSelector((state: RootState) => state.auth.user);

export const GetSession = () =>
  useSelector((state: RootState) => state.auth.session);

export const GetIsAuthenticated = () =>
  useSelector((state: RootState) => state.auth.isAuthenticated);

export const GetAuthLoading = () =>
  useSelector((state: RootState) => state.auth.isLoading);

export const GetAuthError = () =>
  useSelector((state: RootState) => state.auth.error);

export const GetPrograms = () =>
  useSelector((state: RootState) => state.auth.programs);

export const GetActiveProgramId = () =>
  useSelector((state: RootState) => state.auth.activeProgramId);

export const GetActiveProgram = () =>
  useSelector((state: RootState) =>
    state.auth.programs.find(p => p.id === state.auth.activeProgramId) ?? null,
  );

export const GetShiftTypes = () =>
  useSelector((state: RootState) => state.auth.shiftTypes);
