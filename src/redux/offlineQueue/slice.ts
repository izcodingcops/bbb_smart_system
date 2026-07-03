import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import client from '../../api/index';
import {MicroService} from '../../api/microService';
import {fileUploadService} from '../../api/services/fileUpload/fileUploadService';
import {logger} from '../../utils/logger';
import {generateId} from '../../utils/generateId';
import {OfflineRecord} from '../../types/offline';

export interface OfflineQueueState {
  pending: OfflineRecord[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

const initialState: OfflineQueueState = {
  pending: [],
  isSyncing: false,
  lastSyncAt: null,
  lastError: null,
};

export const MAX_RETRY_COUNT = 5;

export function baseUrlFor(record: OfflineRecord): string {
  return record.baseUrl === 'WEB' ? MicroService.BASE_WEB_API : MicroService.BASE_APP_API;
}

export async function uploadRecordFiles(record: OfflineRecord): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {...record.payload};
  for (const file of record.files) {
    const url = await fileUploadService.upload(file);
    payload[file.fieldKey] = url;
  }
  return payload;
}

export async function syncRecord(
  record: OfflineRecord,
  dispatch: (action: unknown) => unknown,
): Promise<boolean> {
  try {
    const payload = record.files.length ? await uploadRecordFiles(record) : record.payload;
    await client.post(`${baseUrlFor(record)}offline/${record.endpoint}`, payload);
    dispatch(dequeueOfflineRecords([record.id]));
    return true;
  } catch (error: any) {
    logger.warn('OfflineQueueSync', `Failed to sync ${record.endpoint}`, error?.message);
    dispatch(recordOfflineFailure(record.id));
    return false;
  }
}

export const syncOfflineQueue = createAsyncThunk(
  'offlineQueue/sync',
  async (_: void, {getState, dispatch}) => {
    const state = getState() as {offlineQueue: OfflineQueueState};
    const syncable = state.offlineQueue.pending.filter(r => r.retryCount < MAX_RETRY_COUNT);

    if (syncable.length === 0) {
      return {anyFailure: false};
    }

    logger.info('OfflineQueueSync', `Syncing ${syncable.length} pending record(s)`);
    let anyFailure = false;
    for (const record of syncable) {
      const ok = await syncRecord(record, dispatch);
      if (!ok) anyFailure = true;
    }
    return {anyFailure};
  },
);

const offlineQueueSlice = createSlice({
  name: 'offlineQueue',
  initialState,
  reducers: {
    enqueueOfflineRecord: {
      reducer(state, action: PayloadAction<OfflineRecord>) {
        state.pending.push(action.payload);
      },
      prepare(record: Omit<OfflineRecord, 'id' | 'createdAt' | 'retryCount'>) {
        return {
          payload: {
            ...record,
            id: generateId(),
            createdAt: new Date().toISOString(),
            retryCount: 0,
          },
        };
      },
    },
    dequeueOfflineRecords(state, action: PayloadAction<string[]>) {
      state.pending = state.pending.filter(r => !action.payload.includes(r.id));
    },
    recordOfflineFailure(state, action: PayloadAction<string>) {
      const record = state.pending.find(r => r.id === action.payload);
      if (record) record.retryCount += 1;
    },
    resetOfflineSyncing(state) {
      state.isSyncing = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(syncOfflineQueue.pending, state => {
        state.isSyncing = true;
        state.lastError = null;
      })
      .addCase(syncOfflineQueue.fulfilled, (state, action) => {
        state.isSyncing = false;
        if (action.payload.anyFailure) {
          state.lastError = 'Some records failed to sync';
        } else {
          state.lastSyncAt = new Date().toISOString();
        }
      });
  },
});

export const {enqueueOfflineRecord, dequeueOfflineRecords, recordOfflineFailure, resetOfflineSyncing} =
  offlineQueueSlice.actions;
export default offlineQueueSlice.reducer;
