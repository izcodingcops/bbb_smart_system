import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {MaintenanceListFilters} from '../../types/maintenance';

export interface MaintenanceUiState {
  filters: MaintenanceListFilters;
}

const initialState: MaintenanceUiState = {
  filters: {},
};

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<MaintenanceListFilters>) {
      state.filters = action.payload;
    },
  },
});

export const {setFilters} = maintenanceSlice.actions;
export default maintenanceSlice.reducer;
