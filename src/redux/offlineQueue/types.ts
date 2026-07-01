import {OfflineRecord} from '../../types/offline';

export const OFFLINE_ENQUEUE = 'offlineQueue/ENQUEUE';
export const OFFLINE_DEQUEUE = 'offlineQueue/DEQUEUE';
export const OFFLINE_RECORD_FAILURE = 'offlineQueue/RECORD_FAILURE';
export const OFFLINE_SYNC_START = 'offlineQueue/SYNC_START';
export const OFFLINE_SYNC_SUCCESS = 'offlineQueue/SYNC_SUCCESS';
export const OFFLINE_SYNC_FAILURE = 'offlineQueue/SYNC_FAILURE';
export const OFFLINE_RESET_SYNCING = 'offlineQueue/RESET_SYNCING';

export interface OfflineQueueState {
  pending: OfflineRecord[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}
