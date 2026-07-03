import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface UiState {
  tabBarHidden: boolean;
}

const initialState: UiState = {
  tabBarHidden: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTabBarHidden(state, action: PayloadAction<boolean>) {
      state.tabBarHidden = action.payload;
    },
  },
});

export const {setTabBarHidden} = uiSlice.actions;
export default uiSlice.reducer;
