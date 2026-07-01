jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    getDeviceName: jest.fn().mockResolvedValue('Test Device'),
    getUniqueId: jest.fn().mockResolvedValue('unique-id'),
    getSystemVersion: jest.fn().mockResolvedValue('17.0'),
    getManufacturer: jest.fn().mockResolvedValue('Apple'),
  },
  getBuildNumber: jest.fn().mockReturnValue('1'),
  getDeviceId: jest.fn().mockReturnValue('device-id'),
  getModel: jest.fn().mockReturnValue('iPhone'),
}));

jest.mock('../utils/locationTracker', () => ({
  locationTracker: {getConnectivityStatus: jest.fn()},
}));

jest.mock('../redux/store', () => ({
  store: {getState: () => ({auth: {}, program: {}, location: {}})},
}));

import {requestInterceptor} from './index';
import {OfflineError} from './offlineError';
import {locationTracker} from '../utils/locationTracker';

describe('requestInterceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws OfflineError for offline-queueable requests when the device is offline', async () => {
    (locationTracker.getConnectivityStatus as jest.Mock).mockResolvedValue(false);

    await expect(
      requestInterceptor({offlineQueueable: true, headers: {}} as any),
    ).rejects.toThrow(OfflineError);
  });

  test('passes through offline-queueable requests when the device is online', async () => {
    (locationTracker.getConnectivityStatus as jest.Mock).mockResolvedValue(true);

    const config = await requestInterceptor({offlineQueueable: true, headers: {}} as any);
    expect(config.headers.Authorization).toBe('');
  });

  test('skips the connectivity check for requests not marked offlineQueueable', async () => {
    const config = await requestInterceptor({headers: {}} as any);
    expect(locationTracker.getConnectivityStatus).not.toHaveBeenCalled();
    expect(config.headers.program_id).toBe('');
  });
});
