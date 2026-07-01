import {call, put, select, takeLatest} from 'redux-saga/effects';
import client from '../../api/index';
import {MicroService} from '../../api/microService';
import {fileUploadService} from '../../api/services/fileUploadService';
import {logger} from '../../utils/logger';
import {OFFLINE_SYNC_START} from './types';
import {OfflineRecord} from '../../types/offline';
import {
  dequeueOfflineRecords,
  recordOfflineFailure,
  offlineSyncSuccess,
  offlineSyncFailure,
} from './actions';

export const MAX_RETRY_COUNT = 5;

export function baseUrlFor(record: OfflineRecord): string {
  return record.baseUrl === 'WEB'
    ? MicroService.BASE_WEB_API
    : MicroService.BASE_APP_API;
}

export function* uploadRecordFiles(record: OfflineRecord) {
  const payload: Record<string, unknown> = {...record.payload};
  for (const file of record.files) {
    const url: string = yield call(fileUploadService.upload, file);
    payload[file.fieldKey] = url;
  }
  return payload;
}

export function* syncRecord(record: OfflineRecord) {
  try {
    const payload: Record<string, unknown> = record.files.length
      ? yield call(uploadRecordFiles, record)
      : record.payload;

    yield call(
      [client, client.post],
      `${baseUrlFor(record)}offline/${record.endpoint}`,
      payload,
    );
    yield put(dequeueOfflineRecords([record.id]));
    return true;
  } catch (error: any) {
    logger.warn('OfflineQueueSaga', `Failed to sync ${record.endpoint}`, error?.message);
    yield put(recordOfflineFailure(record.id));
    return false;
  }
}

export function* offlineSyncSaga() {
  const state: {offlineQueue: {pending: OfflineRecord[]}} = yield select();
  const syncable = state.offlineQueue.pending.filter(r => r.retryCount < MAX_RETRY_COUNT);

  if (syncable.length === 0) {
    yield put(offlineSyncSuccess());
    return;
  }

  logger.info('OfflineQueueSaga', `Syncing ${syncable.length} pending record(s)`);

  let anyFailure = false;
  for (const record of syncable) {
    const ok: boolean = yield call(syncRecord, record);
    if (!ok) anyFailure = true;
  }

  yield put(anyFailure ? offlineSyncFailure('Some records failed to sync') : offlineSyncSuccess());
}

export default function* offlineQueueSaga() {
  yield takeLatest(OFFLINE_SYNC_START, offlineSyncSaga);
}
