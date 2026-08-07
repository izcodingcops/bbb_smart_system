import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {OutboxItem} from '../../types/offlineQueue';
import {initialOutboxState} from './initialState';

export {initialOutboxState};

/**
 * How many times flushOutbox retries one item before dead-lettering it. The
 * policy lives in the reducer so it sits in one pure function with a single
 * entry point — flush.ts only reacts to where the item ended up.
 */
export const MAX_SYNC_ATTEMPTS = 5;

const outboxSlice = createSlice({
  name: 'outbox',
  initialState: initialOutboxState,
  reducers: {
    enqueued(state, action: PayloadAction<OutboxItem>) {
      state.items.push(action.payload);
    },
    synced(state, action: PayloadAction<{id: string}>) {
      state.items = state.items.filter(item => item.id !== action.payload.id);
    },
    /**
     * Records a failed attempt. On the MAX_SYNC_ATTEMPTS-th failure the item
     * moves to `failed`, which is what lets flushOutbox carry on past it
     * without disturbing the order of everything still in `items`.
     */
    syncFailed(state, action: PayloadAction<{id: string; error: string}>) {
      const {id, error} = action.payload;
      const item = state.items.find(i => i.id === id);
      if (!item) {
        return;
      }
      item.attempts += 1;
      item.lastError = error;
      if (item.attempts >= MAX_SYNC_ATTEMPTS) {
        state.failed.push(item);
        state.items = state.items.filter(i => i.id !== id);
      }
    },
    /** Puts a dead-lettered item back at the end of the queue, attempts reset. */
    retryRequested(state, action: PayloadAction<{id: string}>) {
      const {id} = action.payload;
      const item = state.failed.find(i => i.id === id);
      if (!item) {
        return;
      }
      item.attempts = 0;
      item.lastError = null;
      state.items.push(item);
      state.failed = state.failed.filter(i => i.id !== id);
    },
    /** Drops a dead-lettered item for good. */
    discarded(state, action: PayloadAction<{id: string}>) {
      state.failed = state.failed.filter(i => i.id !== action.payload.id);
    },
  },
});

export const {enqueued, synced, syncFailed, retryRequested, discarded} =
  outboxSlice.actions;
export default outboxSlice.reducer;
