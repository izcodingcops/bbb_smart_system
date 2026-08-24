export type AppLanguage = 'English' | 'Spanish';

export interface NotificationModuleSettings {
  maintenance: boolean;
  incident: boolean;
  dispatch: boolean;
  shiftNotes: boolean;
  equipment: boolean;
}

export interface NotificationSettings {
  master: boolean;
  assigned: boolean;
  completed: boolean;
  unassigned: boolean;
  allowNotification: string;
  reminderTime: string;
  dnd: boolean;
  dndFrom: string;
  dndTo: string;
  sound: boolean;
  vibrate: boolean;
  lockscreen: boolean;
  push: boolean;
  byEmail: boolean;
  modules: NotificationModuleSettings;
  tone: string;
  summary: string;
}

export interface SettingsState {
  language: AppLanguage;
  notifications: NotificationSettings;
}
