import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {authService} from '../../api/services/auth/authService';
import {locationTracker} from '../../utils/locationTracker';
import {AuthState, LoginCredentials, User, Session} from '../../types/auth';

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, {rejectWithValue}) => {
    const response = await authService.login(credentials);
    if (response.status !== 200) {
      return rejectWithValue(response.message ?? 'Login failed.');
    }
    const user: User = {
      id: String(response.data.id),
      name: response.data.name,
      username: response.data.username,
      email: response.data.email,
      avatar: response.data.avatar,
      enable_shift_entry: response.data.enable_shift_entry,
    };
    const session: Session = {token: response.data.token};
    return {user, session};
  },
);

export const logout = createAsyncThunk('auth/logout', async (_: void) => {
  try {
    await locationTracker.endSession();
  } catch {
    // best-effort; native session gets cleared below regardless
  }
  locationTracker.stopTracking();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
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
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Login failed.';
      })
      .addCase(logout.pending, state => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const {clearError} = authSlice.actions;
export default authSlice.reducer;
