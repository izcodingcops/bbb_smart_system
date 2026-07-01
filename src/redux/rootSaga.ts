import {all, call, spawn} from 'redux-saga/effects';
import {logger} from '../utils/logger';
import maintenanceSaga from './maintenance/saga';

const sagas = [maintenanceSaga];

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
