import {all, spawn, call, put, take} from 'redux-saga/effects';
import {eventChannel, EventChannel} from 'redux-saga';
import {logger} from '../utils/logger';
import {locationTracker} from '../utils/locationTracker';
import maintenanceSaga from './maintenance/saga';
import {syncOfflineQueue, resetOfflineSyncing} from './offlineQueue/slice';

const sagas = [maintenanceSaga];

export function createConnectivityChannel(): EventChannel<boolean> {
  return eventChannel(emit => {
    const unsubscribe = locationTracker.onConnectivityChange(online => emit(online));
    return () => unsubscribe();
  });
}

export function* watchConnectivityForSync() {
  const channel: EventChannel<boolean> = yield call(createConnectivityChannel);
  while (true) {
    const online: boolean = yield take(channel);
    if (online) {
      yield put(syncOfflineQueue());
    }
  }
}

export default function* rootSaga() {
  yield put(resetOfflineSyncing());
  yield all([
    ...sagas.map(saga =>
      spawn(function* () {
        while (true) {
          try {
            yield call(saga);
            break;
          } catch (e) {
            logger.warn('RootSaga', 'Saga crashed, restarting:', e);
          }
        }
      }),
    ),
    spawn(watchConnectivityForSync),
  ]);
}
