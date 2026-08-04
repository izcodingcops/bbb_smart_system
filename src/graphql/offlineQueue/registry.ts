import {DocumentNode} from 'graphql';
import {Feature} from '../../config/transport';
import {OfflineMutationKey} from '../../types/offlineQueue';
import {CREATE_WORK_LOG_ENTRY} from '../features/workLog/documents';
import {CREATE_FIXTURE} from '../features/fixture/documents';
import {CREATE_MAINTENANCE_REQUEST} from '../features/maintenance/documents';
import {CREATE_DISPATCH_INCIDENT} from '../features/dispatch/documents';

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
  CREATE_FIXTURE: {
    document: CREATE_FIXTURE,
    feature: 'fixture',
    refetchQueries: ['GetFixtures'],
    buildOptimisticData: localId => ({
      createFixture: {__typename: 'Fixture', id: localId, reference: 'Pending'},
    }),
  },
  CREATE_MAINTENANCE_REQUEST: {
    document: CREATE_MAINTENANCE_REQUEST,
    feature: 'maintenance',
    refetchQueries: ['GetMaintenanceRequests'],
    buildOptimisticData: localId => ({
      createMaintenanceRequest: {
        __typename: 'MaintenanceRequest',
        id: localId,
        reference: 'Pending',
      },
    }),
  },
  CREATE_DISPATCH_INCIDENT: {
    document: CREATE_DISPATCH_INCIDENT,
    feature: 'dispatch',
    refetchQueries: ['GetDispatch'],
    buildOptimisticData: localId => ({
      createDispatchIncident: {
        __typename: 'DispatchIncident',
        id: localId,
        reference: 'Pending',
        label: 'Pending',
      },
    }),
  },
};
