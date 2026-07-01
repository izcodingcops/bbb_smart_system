import {OfflineRecord} from '../../types/offline';
import {
  OFFLINE_ENQUEUE,
  OFFLINE_DEQUEUE,
  OFFLINE_RECORD_FAILURE,
  OFFLINE_SYNC_START,
  OFFLINE_SYNC_SUCCESS,
  OFFLINE_SYNC_FAILURE,
  OFFLINE_RESET_SYNCING,
} from './types';

export const enqueueOfflineRecord = (
  record: Omit<OfflineRecord, 'id' | 'createdAt' | 'retryCount'>,
) => ({type: OFFLINE_ENQUEUE, payload: record});

export const dequeueOfflineRecords = (ids: string[]) => ({
  type: OFFLINE_DEQUEUE,
  payload: {ids},
});

export const recordOfflineFailure = (id: string) => ({
  type: OFFLINE_RECORD_FAILURE,
  payload: {id},
});

export const requestOfflineSync = () => ({type: OFFLINE_SYNC_START});
export const offlineSyncSuccess = () => ({type: OFFLINE_SYNC_SUCCESS});
export const offlineSyncFailure = (error: string) => ({
  type: OFFLINE_SYNC_FAILURE,
  payload: error,
});
export const resetOfflineSyncing = () => ({type: OFFLINE_RESET_SYNCING});
