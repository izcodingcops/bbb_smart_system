import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {logout} from '../auth/slice';

export interface ShiftState {
  shiftTypeId: string | null;
  startTime: string | null; // ISO string
  autoEnd: boolean;
  isActive: boolean;
}

const initialState: ShiftState = {
  shiftTypeId: null,
  startTime: null,
  autoEnd: true,
  isActive: false,
};

interface StartShiftPayload {
  shiftTypeId: string;
  startTime: string;
  autoEnd: boolean;
}

const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    startShift(state, action: PayloadAction<StartShiftPayload>) {
      state.shiftTypeId = action.payload.shiftTypeId;
      state.startTime = action.payload.startTime;
      state.autoEnd = action.payload.autoEnd;
      state.isActive = true;
    },
    endShift() {
      return initialState;
    },
  },
  extraReducers: builder => {
    // Clear any shift setup when the user logs out.
    builder.addCase(logout.fulfilled, () => initialState);
  },
});

export const {startShift, endShift} = shiftSlice.actions;
export default shiftSlice.reducer;
