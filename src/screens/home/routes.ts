import {NotificationRecordType} from '../../types/notification';

/**
 * Route table for the Home tab's stack. Kept in its own file so the home
 * screen can import the param list without importing the navigator that
 * renders it.
 */
export type HomeStackParamList = {
  HomeMain: undefined;
  /** Full-screen push off the header's bell. */
  HomeNotifications: undefined;
  /**
   * A record opened from a notification, rendered here rather than on the
   * owning module's tab so back returns to the Notifications list the user
   * came from. The same approach the Work tab already uses to show
   * maintenance and fixture records inside its own stack.
   */
  HomeRecordView: {kind: NotificationRecordType; id: string};
};
