import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {logout} from '../auth/slice';
import {startShift} from '../shift/slice';

/** Why the user dropped back into setup, so it can open on the right step. */
export type SetupIntent = 'program' | 'shift_type';

/**
 * A create flow asked for from outside the module that owns it — the Add
 * Requests sheet is on every tab, but each create screen is local route state
 * inside its own module's screen.
 */
export interface CreateRequest {
  /** Screen name of the module that owns the create flow. */
  target: string;
  /** Tab the request came from, to return to if the form is closed unsaved. */
  origin: string;
}

export interface UiState {
  tabBarHidden: boolean;
  setupIntent: SetupIntent | null;
  /** Screen name the navigator should switch to, spent on arrival. */
  pendingScreen: string | null;
  /** Create flow the arriving module should open, spent on arrival. */
  pendingCreate: CreateRequest | null;
}

const initialState: UiState = {
  tabBarHidden: false,
  setupIntent: null,
  pendingScreen: null,
  pendingCreate: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTabBarHidden(state, action: PayloadAction<boolean>) {
      state.tabBarHidden = action.payload;
    },
    setSetupIntent(state, action: PayloadAction<SetupIntent | null>) {
      state.setupIntent = action.payload;
    },
    /** Switch tabs and open that module's create flow on arrival. */
    requestCreate(state, action: PayloadAction<CreateRequest>) {
      state.pendingScreen = action.payload.target;
      state.pendingCreate = action.payload;
    },
    clearPendingCreate(state) {
      state.pendingCreate = null;
    },
    /** Switch tabs and nothing more — how a closed create form goes back. */
    requestScreen(state, action: PayloadAction<string>) {
      state.pendingScreen = action.payload;
    },
    clearPendingScreen(state) {
      state.pendingScreen = null;
    },
  },
  extraReducers: builder => {
    // The intent only steers the trip through setup — spend it on arrival, so
    // the next login starts from the normal first step.
    builder.addCase(startShift, state => {
      state.setupIntent = null;
    });
    builder.addCase(logout.fulfilled, () => initialState);
  },
});

export const {
  setTabBarHidden,
  setSetupIntent,
  requestCreate,
  clearPendingCreate,
  requestScreen,
  clearPendingScreen,
} = uiSlice.actions;
export default uiSlice.reducer;
