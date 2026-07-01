import {all, spawn, call, put, take} from 'redux-saga/effects';
import {eventChannel, EventChannel} from 'redux-saga';
import {logger} from '../utils/logger';
import {locationTracker} from '../utils/locationTracker';
import authSaga from './auth/saga';
import programSaga from './program/saga';
import offlineQueueSaga from './offlineQueue/saga';
import maintenanceSaga from './maintenance/saga';
import {requestOfflineSync, resetOfflineSyncing} from './offlineQueue/actions';

const sagas = [authSaga, programSaga, offlineQueueSaga, maintenanceSaga];

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
      yield put(requestOfflineSync());
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
