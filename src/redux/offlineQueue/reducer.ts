import {generateId} from '../../utils/generateId';
import {
  OFFLINE_ENQUEUE,
  OFFLINE_DEQUEUE,
  OFFLINE_RECORD_FAILURE,
  OFFLINE_SYNC_START,
  OFFLINE_SYNC_SUCCESS,
  OFFLINE_SYNC_FAILURE,
  OFFLINE_RESET_SYNCING,
  OfflineQueueState,
} from './types';

const initialState: OfflineQueueState = {
  pending: [],
  isSyncing: false,
  lastSyncAt: null,
  lastError: null,
};

export default function offlineQueueReducer(
  state: OfflineQueueState = initialState,
  action: any,
): OfflineQueueState {
  switch (action.type) {
    case OFFLINE_ENQUEUE:
      return {
        ...state,
        pending: [
          ...state.pending,
          {
            ...action.payload,
            id: generateId(),
            createdAt: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      };
    case OFFLINE_DEQUEUE:
      return {
        ...state,
        pending: state.pending.filter(r => !action.payload.ids.includes(r.id)),
      };
    case OFFLINE_RECORD_FAILURE:
      return {
        ...state,
        pending: state.pending.map(r =>
          r.id === action.payload.id ? {...r, retryCount: r.retryCount + 1} : r,
        ),
      };
    case OFFLINE_SYNC_START:
      return {...state, isSyncing: true, lastError: null};
    case OFFLINE_SYNC_SUCCESS:
      return {...state, isSyncing: false, lastSyncAt: new Date().toISOString()};
    case OFFLINE_SYNC_FAILURE:
      return {...state, isSyncing: false, lastError: action.payload};
    case OFFLINE_RESET_SYNCING:
      return {...state, isSyncing: false};
    default:
      return state;
  }
}
