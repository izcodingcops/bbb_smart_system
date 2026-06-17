import {NativeModules, NativeEventEmitter, Platform} from 'react-native';
import {logger} from './logger';

const {UserDataModule} = NativeModules;
const emitter = UserDataModule ? new NativeEventEmitter(UserDataModule) : null;

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
    if (Platform.OS !== 'ios' || !UserDataModule) return;
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
    if (Platform.OS !== 'ios' || !UserDataModule) return;
    logger.info('LocationTracker', 'Stopping native location tracking');
    UserDataModule.clearUserDetails();
  },

  syncNow: () => {
    if (Platform.OS !== 'ios' || !UserDataModule) return;
    logger.info('LocationTracker', 'Manual sync triggered');
    UserDataModule.syncLocationData();
  },

  endSession: (): Promise<boolean> => {
    if (Platform.OS !== 'ios' || !UserDataModule) return Promise.resolve(true);
    return UserDataModule.endUserSession().then(
      () => true,
      () => false,
    );
  },

  checkCanLogOut: (): Promise<boolean> => {
    if (Platform.OS !== 'ios' || !UserDataModule) return Promise.resolve(true);
    return new Promise(resolve => {
      UserDataModule.checkForLogOut((result: string) => resolve(result === 'true'));
    });
  },

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
