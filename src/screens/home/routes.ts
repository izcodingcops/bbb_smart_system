/**
 * Route table for the Home tab's stack. Kept in its own file so the home
 * screen can import the param list without importing the navigator that
 * renders it.
 */
export type HomeStackParamList = {
  HomeMain: undefined;
  /** Full-screen push off the header's bell. */
  HomeNotifications: undefined;
};
