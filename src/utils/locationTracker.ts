import { NativeModules, NativeEventEmitter } from 'react-native';
import { logger } from './logger';

const { LocationBridge } = NativeModules;
const emitter = LocationBridge ? new NativeEventEmitter(LocationBridge) : null;

export type SmoothingFilter = 'gaussian' | 'kalman' | 'none';

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

export type PermissionStage =
  | 'fine'
  | 'background'
  | 'activity'
  | 'notifications';

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
    if (!LocationBridge) return;
    logger.info(
      'LocationTracker',
      'Starting native location tracking',
      data.sessionId,
    );
    LocationBridge.saveUserDetailsAndStartLocationUpdates({
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
    if (!LocationBridge) return;
    logger.info('LocationTracker', 'Stopping native location tracking');
    LocationBridge.clearUserDetails();
  },

  syncNow: () => {
    if (!LocationBridge) return;
    logger.info('LocationTracker', 'Manual sync triggered');
    LocationBridge.syncLocationData();
  },

  endSession: (): Promise<boolean> => {
    if (!LocationBridge) return Promise.resolve(true);
    return LocationBridge.endUserSession().then(
      () => true,
      () => false,
    );
  },

  checkCanLogOut: (): Promise<boolean> => {
    if (!LocationBridge) return Promise.resolve(true);
    return new Promise(resolve => {
      LocationBridge.checkForLogOut((result: string) =>
        resolve(result === 'true'),
      );
    });
  },

  // ---- Debug --------------------------------------------------------------

  /** Opens the iOS share sheet for the GPS CSV log. Resolves false if the
   *  native method is unavailable or no log file exists yet. */
  shareGpsLog: (): Promise<boolean> => {
    if (!LocationBridge?.shareLogFile) return Promise.resolve(false);
    return LocationBridge.shareLogFile().then(
      () => true,
      (e: unknown) => {
        logger.warn('LocationTracker', 'shareGpsLog failed', e);
        return false;
      },
    );
  },

  getConnectivityStatus: (): Promise<boolean> => {
    if (!LocationBridge?.getConnectivityStatus) return Promise.resolve(true);
    return LocationBridge.getConnectivityStatus();
  },

  onConnectivityChange: (callback: (isOnline: boolean) => void) => {
    if (!emitter) return () => {};
    const sub = emitter.addListener(
      'onConnectivityChange',
      (e: { isOnline: boolean }) => callback(e.isOnline),
    );
    return () => sub.remove();
  },

  getSmoothingFilter: (): Promise<SmoothingFilter> => {
    if (!LocationBridge?.getSmoothingFilter) return Promise.resolve('gaussian');
    return LocationBridge.getSmoothingFilter();
  },

  setSmoothingFilter: (name: SmoothingFilter) => {
    LocationBridge?.setSmoothingFilter?.(name);
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
    if (!LocationBridge?.getCurrentLocation) {
      return Promise.reject(new Error('getCurrentLocation not available'));
    }
    return LocationBridge.getCurrentLocation();
  },

  // ---- Permissions --------------------------------------------------------

  getPermissionStatus: (): Promise<PermissionStatus> => {
    if (!LocationBridge?.getPermissionStatus) return Promise.resolve('ok');
    return LocationBridge.getPermissionStatus();
  },

  /**
   * Promise-based runtime prompt for one stage. Resolves with `true` iff every
   * permission in the stage was granted — and only after the user has actually
   * responded to the system dialog.
   */
  requestStage: (stage: PermissionStage): Promise<boolean> => {
    if (!LocationBridge?.requestStage) return Promise.resolve(true);
    return LocationBridge.requestStage(stage);
  },

  openAppSettings: () => {
    LocationBridge?.openAppSettings?.();
  },

  openLocationSettings: () => {
    LocationBridge?.openLocationSettings?.();
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
    const sub = emitter.addListener(
      'onUploadProgress',
      (e: { progress: number }) => {
        callback(e.progress);
      },
    );
    return () => sub.remove();
  },

  onUploadComplete: (callback: (status: string) => void) => {
    if (!emitter) return () => {};
    const sub = emitter.addListener(
      'onUploadComplete',
      (e: { status: string }) => {
        callback(e.status);
      },
    );
    return () => sub.remove();
  },
};
