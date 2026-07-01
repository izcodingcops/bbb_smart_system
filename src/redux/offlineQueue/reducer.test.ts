import offlineQueueReducer from './reducer';
import {
  enqueueOfflineRecord,
  dequeueOfflineRecords,
  recordOfflineFailure,
  requestOfflineSync,
  offlineSyncSuccess,
  offlineSyncFailure,
  resetOfflineSyncing,
} from './actions';

describe('offlineQueueReducer', () => {
  const baseRecord = {
    endpoint: 'addWork',
    baseUrl: 'WEB' as const,
    payload: {note: 'test'},
    files: [],
  };

  test('enqueues a record with generated id, timestamp, and zero retryCount', () => {
    const state = offlineQueueReducer(undefined, enqueueOfflineRecord(baseRecord));
    expect(state.pending).toHaveLength(1);
    expect(state.pending[0]).toMatchObject({
      endpoint: 'addWork',
      baseUrl: 'WEB',
      retryCount: 0,
    });
    expect(state.pending[0].id).toBeTruthy();
    expect(state.pending[0].createdAt).toBeTruthy();
  });

  test('dequeues records by id', () => {
    let state = offlineQueueReducer(undefined, enqueueOfflineRecord(baseRecord));
    const id = state.pending[0].id;
    state = offlineQueueReducer(state, dequeueOfflineRecords([id]));
    expect(state.pending).toHaveLength(0);
  });

  test('increments retryCount on failure without removing the record', () => {
    let state = offlineQueueReducer(undefined, enqueueOfflineRecord(baseRecord));
    const id = state.pending[0].id;
    state = offlineQueueReducer(state, recordOfflineFailure(id));
    expect(state.pending[0].retryCount).toBe(1);
  });

  test('sync lifecycle updates isSyncing, lastSyncAt, and lastError', () => {
    let state = offlineQueueReducer(undefined, requestOfflineSync());
    expect(state.isSyncing).toBe(true);
    expect(state.lastError).toBeNull();

    state = offlineQueueReducer(state, offlineSyncSuccess());
    expect(state.isSyncing).toBe(false);
    expect(state.lastSyncAt).toBeTruthy();

    state = offlineQueueReducer(state, offlineSyncFailure('network down'));
    expect(state.isSyncing).toBe(false);
    expect(state.lastError).toBe('network down');
  });

  test('resetOfflineSyncing forces isSyncing back to false', () => {
    let state = offlineQueueReducer(undefined, requestOfflineSync());
    state = offlineQueueReducer(state, resetOfflineSyncing());
    expect(state.isSyncing).toBe(false);
  });
});
