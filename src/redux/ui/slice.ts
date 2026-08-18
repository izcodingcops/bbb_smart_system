import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {logout} from '../auth/slice';
import {startShift} from '../shift/slice';

/** Why the user dropped back into setup, so it can open on the right step. */
export type SetupIntent = 'program' | 'shift_type';

/**
 * A toast that outlives the screen that raised it — for a create flow that
 * hands control back to another tab (via `origin`) rather than staying on its
 * own module's screen to show it locally.
 */
export interface GlobalToast {
  title: string;
  message: string;
  variant?: 'success' | 'danger';
}

export interface UiState {
  setupIntent: SetupIntent | null;
  globalToast: GlobalToast | null;
}

const initialState: UiState = {
  setupIntent: null,
  globalToast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSetupIntent(state, action: PayloadAction<SetupIntent | null>) {
      state.setupIntent = action.payload;
    },
    showGlobalToast(state, action: PayloadAction<GlobalToast>) {
      state.globalToast = action.payload;
    },
    clearGlobalToast(state) {
      state.globalToast = null;
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

export const {setSetupIntent, showGlobalToast, clearGlobalToast} =
  uiSlice.actions;
export default uiSlice.reducer;
