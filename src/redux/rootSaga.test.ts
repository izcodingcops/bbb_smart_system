jest.mock('../utils/locationTracker', () => ({
  locationTracker: {onConnectivityChange: jest.fn(() => () => {})},
}));

jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    getDeviceName: jest.fn(),
    getUniqueId: jest.fn(),
    getSystemVersion: jest.fn(),
    getManufacturer: jest.fn(),
  },
  getBuildNumber: jest.fn(),
  getDeviceId: jest.fn(),
  getModel: jest.fn(),
}));

import {call, put, take} from 'redux-saga/effects';
import rootSaga, {createConnectivityChannel, watchConnectivityForSync} from './rootSaga';
import {requestOfflineSync, resetOfflineSyncing} from './offlineQueue/actions';

describe('rootSaga', () => {
  test('resets isSyncing before spawning the feature sagas', () => {
    const gen = rootSaga();
    expect(gen.next().value).toEqual(put(resetOfflineSyncing()));
  });
});

describe('watchConnectivityForSync', () => {
  test('dispatches requestOfflineSync only when connectivity comes back online', () => {
    const gen = watchConnectivityForSync();
    expect(gen.next().value).toEqual(call(createConnectivityChannel));

    const channel = createConnectivityChannel();
    let step = gen.next(channel as any);
    expect(step.value).toEqual(take(channel));

    step = gen.next(false);
    expect(step.value).toEqual(take(channel));

    step = gen.next(true);
    expect(step.value).toEqual(put(requestOfflineSync()));
  });
});
