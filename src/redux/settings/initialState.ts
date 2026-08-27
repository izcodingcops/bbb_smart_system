import {SettingsState} from '../../types/settings';

export const initialSettingsState: SettingsState = {
  language: 'English',
  notifications: {
    master: true,
    assigned: true,
    completed: true,
    unassigned: true,
    allowNotification: 'Everyday',
    reminderTime: '09:00 AM',
    dnd: true,
    dndFrom: '10:00 PM',
    dndTo: '06:00 AM',
    sound: true,
    vibrate: true,
    lockscreen: true,
    push: true,
    byEmail: true,
    modules: {
      maintenance: true,
      incident: true,
      dispatch: false,
      shiftNotes: true,
      equipment: true,
    },
    tone: 'System Setting',
    summary: 'Weekly digest',
  },
};
