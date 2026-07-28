import {AuthState} from '../../types/auth';

/**
 * Kept out of slice.ts so redux-persist migrations can import it without
 * pulling in the slice's thunks — and through them the Apollo client and the
 * native location module.
 */
export const initialAuthState: AuthState = {
  user: null,
  session: null,
  programs: [],
  activeProgramId: null,
  shiftTypes: [],
  isLoading: false,
  error: null,
  isAuthenticated: false,
};
