import {all, spawn, call} from 'redux-saga/effects';
import {logger} from '../utils/logger';
import authSaga from './auth/saga';
import programSaga from './program/saga';
import navigationSaga from './navigation/saga';

const sagas = [authSaga, programSaga, navigationSaga];

export default function* rootSaga() {
  yield all(
    sagas.map(saga =>
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
  );
}
