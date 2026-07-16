import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {logout} from '../auth/slice';
import {ShiftState} from '../../types/shift';

export const initialShiftState: ShiftState = {
  shiftTypeId: null,
  startTime: null,
  stopTime: null,
  autoEnd: true,
  isActive: false,
};

interface StartShiftPayload {
  shiftTypeId: string;
  startTime: string;
  stopTime: string;
  autoEnd: boolean;
}

const shiftSlice = createSlice({
  name: 'shift',
  initialState: initialShiftState,
  reducers: {
    startShift(state, action: PayloadAction<StartShiftPayload>) {
      state.shiftTypeId = action.payload.shiftTypeId;
      state.startTime = action.payload.startTime;
      state.stopTime = action.payload.stopTime;
      state.autoEnd = action.payload.autoEnd;
      state.isActive = true;
    },
    endShift() {
      return initialShiftState;
    },
  },
  extraReducers: builder => {
    // Clear any shift setup when the user logs out.
    builder.addCase(logout.fulfilled, () => initialShiftState);
  },
});

export const {startShift, endShift} = shiftSlice.actions;
export default shiftSlice.reducer;
