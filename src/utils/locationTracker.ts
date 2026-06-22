import {NativeModules, NativeEventEmitter} from 'react-native';
import {logger} from './logger';

const {UserDataModule} = NativeModules;
const emitter = UserDataModule ? new NativeEventEmitter(UserDataModule) : null;

export type PermissionStatus =
  | 'ok'
  | 'services_off'
  | 'fine_denied'
  | 'fine_blocked'
  | 'background_denied'
  | 'background_blocked'
  | 'background_settings_only'
  | 'activity_denied'
  | 'activity_blocked';

export type PermissionStage = 'fine' | 'background' | 'activity' | 'notifications';

export interface SessionData {
  sessionId: string | number;
  deviceId: string;
  deviceType: string;
  deviceName: string;
  shiftId: string | number;
  horizontal_accuracy: number;
  user_id: string | number;
  cube_url: string;
  timezone_str?: string;
}

export const locationTracker = {
  startTracking: (data: SessionData) => {
    if (!UserDataModule) return;
    logger.info('LocationTracker', 'Starting native location tracking', data.sessionId);
    UserDataModule.saveUserDetailsAndStartLocationUpdates({
      sessionId: String(data.sessionId),
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      deviceName: data.deviceName,
      shiftId: String(data.shiftId),
      horizontal_accuracy: String(data.horizontal_accuracy),
      user_id: String(data.user_id),
      cube_url: data.cube_url,
      time_zone: data.timezone_str ?? 'America/New_York',
    });
  },

  stopTracking: () => {
    if (!UserDataModule) return;
    logger.info('LocationTracker', 'Stopping native location tracking');
    UserDataModule.clearUserDetails();
  },

  syncNow: () => {
    if (!UserDataModule) return;
    logger.info('LocationTracker', 'Manual sync triggered');
    UserDataModule.syncLocationData();
  },

  endSession: (): Promise<boolean> => {
    if (!UserDataModule) return Promise.resolve(true);
    return UserDataModule.endUserSession().then(
      () => true,
      () => false,
    );
  },

  checkCanLogOut: (): Promise<boolean> => {
    if (!UserDataModule) return Promise.resolve(true);
    return new Promise(resolve => {
      UserDataModule.checkForLogOut((result: string) => resolve(result === 'true'));
    });
  },

  // ---- One-shot location --------------------------------------------------

  getCurrentLocation: (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number;
    speed: number;
    heading: number;
    timestamp: number;
  }> => {
    if (!UserDataModule?.getCurrentLocation) {
      return Promise.reject(new Error('getCurrentLocation not available'));
    }
    return UserDataModule.getCurrentLocation();
  },

  // ---- Permissions --------------------------------------------------------

  getPermissionStatus: (): Promise<PermissionStatus> => {
    if (!UserDataModule?.getPermissionStatus) return Promise.resolve('ok');
    return UserDataModule.getPermissionStatus();
  },

  /**
   * Promise-based runtime prompt for one stage. Resolves with `true` iff every
   * permission in the stage was granted — and only after the user has actually
   * responded to the system dialog.
   */
  requestStage: (stage: PermissionStage): Promise<boolean> => {
    if (!UserDataModule?.requestStage) return Promise.resolve(true);
    return UserDataModule.requestStage(stage);
  },

  openAppSettings: () => {
    UserDataModule?.openAppSettings?.();
  },

  openLocationSettings: () => {
    UserDataModule?.openLocationSettings?.();
  },

  /** Fires whenever MainActivity.onResume runs — used to recheck perms after Settings round-trips. */
  onAppResumed: (callback: () => void) => {
    if (!emitter) return () => {};
    const sub = emitter.addListener('onAppResumed', callback);
    return () => sub.remove();
  },

  // ---- Upload progress events --------------------------------------------

  onUploadProgress: (callback: (progress: number) => void) => {
    if (!emitter) return () => {};
    const sub = emitter.addListener('onUploadProgress', (e: {progress: number}) => {
      callback(e.progress);
    });
    return () => sub.remove();
  },

  onUploadComplete: (callback: (status: string) => void) => {
    if (!emitter) return () => {};
    const sub = emitter.addListener('onUploadComplete', (e: {status: string}) => {
      callback(e.status);
    });
    return () => sub.remove();
  },
};
