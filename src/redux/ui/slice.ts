import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {logout} from '../auth/slice';
import {startShift} from '../shift/slice';

/** Why the user dropped back into setup, so it can open on the right step. */
export type SetupIntent = 'program' | 'shift_type';

export interface UiState {
  setupIntent: SetupIntent | null;
}

const initialState: UiState = {
  setupIntent: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSetupIntent(state, action: PayloadAction<SetupIntent | null>) {
      state.setupIntent = action.payload;
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

export const {setSetupIntent} = uiSlice.actions;
export default uiSlice.reducer;
