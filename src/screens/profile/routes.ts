/**
 * Route table for the Profile tab's stack. Language & Region has no route of
 * its own — it's a `SingleSelectSheet` opened directly from ProfileMain.
 */
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
};
