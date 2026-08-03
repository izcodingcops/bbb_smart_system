import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {OutboxItem} from '../../types/offlineQueue';
import {initialOutboxState} from './initialState';

export {initialOutboxState};

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
  },
});

export const {enqueued, synced} = outboxSlice.actions;
export default outboxSlice.reducer;
