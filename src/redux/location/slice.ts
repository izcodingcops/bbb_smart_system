import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  horizontalAccuracy: number;
  verticalAccuracy: number | null;
  heading: number | null;
  timestamp: number;
}

export interface LocationState {
  currentLocation: UserLocation | null;
}

const initialState: LocationState = {
  currentLocation: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateLocation(state, action: PayloadAction<UserLocation>) {
      state.currentLocation = action.payload;
    },
  },
});

export const {updateLocation} = locationSlice.actions;
export default locationSlice.reducer;
