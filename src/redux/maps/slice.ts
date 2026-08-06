import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DownloadedMap} from '../../types/maps';
import {initialMapsState} from './initialState';

export {initialMapsState};

const mapsSlice = createSlice({
  name: 'maps',
  initialState: initialMapsState,
  reducers: {
    /** Prepends — newest first, matching the mockup's `.concat(st.list)`. */
    mapDownloaded(state, action: PayloadAction<DownloadedMap>) {
      state.items.unshift(action.payload);
    },
    mapDeleted(state, action: PayloadAction<{id: string}>) {
      state.items = state.items.filter(item => item.id !== action.payload.id);
    },
  },
});

export const {mapDownloaded, mapDeleted} = mapsSlice.actions;
export default mapsSlice.reducer;
