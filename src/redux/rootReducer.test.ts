import rootReducer from './rootReducer';

test('rootReducer includes the offlineQueue slice with its initial shape', () => {
  const state = rootReducer(undefined, {type: '@@INIT'});
  expect(state.offlineQueue).toEqual({
    pending: [],
    isSyncing: false,
    lastSyncAt: null,
    lastError: null,
  });
});
