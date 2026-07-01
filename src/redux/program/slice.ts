import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Program} from '../../types/program';

export interface ProgramState {
  selectedProgram: Program | null;
}

const initialState: ProgramState = {
  selectedProgram: null,
};

const programSlice = createSlice({
  name: 'program',
  initialState,
  reducers: {
    selectProgram(state, action: PayloadAction<Program>) {
      state.selectedProgram = action.payload;
    },
    clearProgram(state) {
      state.selectedProgram = null;
    },
  },
});

export const {selectProgram, clearProgram} = programSlice.actions;
export default programSlice.reducer;
