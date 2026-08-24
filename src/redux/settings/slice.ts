import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppLanguage, NotificationSettings} from '../../types/settings';
import {initialSettingsState} from './initialState';

export {initialSettingsState};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    setLanguage(state, action: PayloadAction<AppLanguage>) {
      state.language = action.payload;
    },
    /** The screen edits a local draft and dispatches once on Save. */
    setNotificationSettings(state, action: PayloadAction<NotificationSettings>) {
      state.notifications = action.payload;
    },
  },
});

export const {setLanguage, setNotificationSettings} = settingsSlice.actions;
export default settingsSlice.reducer;
