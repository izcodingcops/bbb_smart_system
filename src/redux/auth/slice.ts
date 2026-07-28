import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {REHYDRATE} from 'redux-persist';
import {authApi} from '../../graphql/features/auth/hooks';
import {authToken} from '../../graphql/authToken';
import {apolloClient} from '../../graphql/client';
import {locationTracker} from '../../utils/locationTracker';
import {AuthState, LoginCredentials, User} from '../../types/auth';
import {initialAuthState} from './initialState';

export {initialAuthState};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, {rejectWithValue}) => {
    const result = await authApi.login(credentials);

    // Not `status !== 200` — the union member IS the outcome, and TypeScript
    // narrows `result` to InvalidCredentials inside this branch.
    if (result.__typename !== 'AuthSession') {
      return rejectWithValue(result.message);
    }

    authToken.set(result.token);

    const user: User = {
      id: result.user.id,
      name: result.user.name,
      username: result.user.username,
      // Schema nullables are `null`; app state uses `undefined`.
      email: result.user.email ?? undefined,
      avatar: result.user.avatar ?? undefined,
      enableShiftEntry: result.user.enableShiftEntry,
    };

    return {
      user,
      session: {token: result.token},
      programs: result.user.programs,
      shiftTypes: result.shiftTypes,
    };
  },
);

export const logout = createAsyncThunk('auth/logout', async (_: void) => {
  try {
    await locationTracker.endSession();
  } catch {
    // best-effort; native session gets cleared below regardless
  }
  try {
    locationTracker.stopTracking();
  } catch {
    // best-effort; the teardown below must happen regardless
  }
  authToken.set(null);
  // Drop every cached entity so the next user never sees the previous one's data.
  await apolloClient.clearStore();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    selectProgram(state, action: PayloadAction<string>) {
      state.activeProgramId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.programs = action.payload.programs;
        state.shiftTypes = action.payload.shiftTypes;
        // Auto-select when there's nothing to choose (0 or 1 program) so the
        // selection screen only appears for 2+ programs.
        state.activeProgramId =
          action.payload.programs.length <= 1
            ? action.payload.programs[0]?.id ?? null
            : null;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Login failed.';
      })
      .addCase(logout.pending, state => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, () => initialAuthState)
      .addCase(logout.rejected, () => initialAuthState)
      // A persisted token has to get back into the link on cold start,
      // otherwise the first request after a relaunch is anonymous.
      .addMatcher(
        (action): action is {type: string; payload?: {auth?: AuthState}} =>
          action.type === REHYDRATE,
        (_state, action) => {
          const token = action.payload?.auth?.session?.token;
          if (token) {
            authToken.set(token);
          }
        },
      );
  },
});

export const {clearError, selectProgram} = authSlice.actions;
export default authSlice.reducer;
