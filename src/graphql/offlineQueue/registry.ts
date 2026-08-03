import {DocumentNode} from 'graphql';
import {Feature} from '../../config/transport';
import {OfflineMutationKey} from '../../types/offlineQueue';
import {CREATE_WORK_LOG_ENTRY} from '../features/workLog/documents';

interface OfflineMutationEntry {
  document: DocumentNode;
  feature: Feature;
  refetchQueries: string[];
  /**
   * The synthetic response handed back to the calling `useMutation` while
   * the real create is still sitting in the outbox, keyed by the
   * mutation's own root field — mirrors what a real resolver would return.
   */
  buildOptimisticData: (localId: string) => Record<string, unknown>;
}

export const OFFLINE_MUTATIONS: Record<OfflineMutationKey, OfflineMutationEntry> = {
  CREATE_WORK_LOG_ENTRY: {
    document: CREATE_WORK_LOG_ENTRY,
    feature: 'workLog',
    refetchQueries: ['GetWorkLogEntries', 'GetWorkItems'],
    buildOptimisticData: localId => ({
      createWorkLogEntry: {__typename: 'WorkLogEntry', id: localId, reference: 'Pending'},
    }),
  },
};
