import {useAppSelector} from '../store';

export const GetPendingRecords = () =>
  useAppSelector(state => state.offlineQueue.pending);

export const GetPendingCount = () =>
  useAppSelector(state => state.offlineQueue.pending.length);

export const GetIsSyncing = () =>
  useAppSelector(state => state.offlineQueue.isSyncing);

export const GetLastSyncAt = () =>
  useAppSelector(state => state.offlineQueue.lastSyncAt);

export const GetLastSyncError = () =>
  useAppSelector(state => state.offlineQueue.lastError);
