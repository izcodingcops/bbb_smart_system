import {DocumentNode} from 'graphql';
import {Feature} from '../../config/transport';
import {OfflineMutationKey} from '../../types/offlineQueue';
import {CREATE_WORK_LOG_ENTRY} from '../features/workLog/documents';
import {CREATE_FIXTURE} from '../features/fixture/documents';
import {CREATE_MAINTENANCE_REQUEST} from '../features/maintenance/documents';
import {CREATE_INCIDENT} from '../features/incident/documents';
import {
  ADD_POI_INTERACTION,
  ADD_POI_UPDATE,
  CREATE_POI,
} from '../features/poi/documents';
import {
  ADD_EQUIPMENT_UPKEEP,
  CHECK_IN_EQUIPMENT,
  CHECK_OUT_EQUIPMENT,
  CREATE_EQUIPMENT,
} from '../features/equipment/documents';

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
  CREATE_INCIDENT: {
    document: CREATE_INCIDENT,
    feature: 'incident',
    // Unconditional here (unlike the hook's own per-call conditional) —
    // the registry has no way to know at flush time whether the queued
    // create was dispatch-linked. Refetching an inactive 'GetDispatch'
    // query still runs to completion — it just triggers Apollo's dev-only
    // console warning ("Unknown query named ... requested in
    // refetchQueries"), not an error.
    refetchQueries: ['GetIncidents', 'GetDispatch'],
    buildOptimisticData: localId => ({
      createIncident: {__typename: 'Incident', id: localId, reference: 'Pending'},
    }),
  },
  CREATE_POI: {
    document: CREATE_POI,
    feature: 'poi',
    refetchQueries: ['GetPois'],
    buildOptimisticData: localId => ({
      createPoi: {__typename: 'Poi', id: localId, reference: 'Pending'},
    }),
  },
  // A queued interaction has no list row of its own to appear in — unlike a
  // queued person, there's no pending-items projection for it. It surfaces on
  // the person's timeline once it syncs; the submit toast says as much.
  ADD_POI_INTERACTION: {
    document: ADD_POI_INTERACTION,
    feature: 'poi',
    refetchQueries: ['GetPois', 'GetPoi'],
    buildOptimisticData: localId => ({
      addPoiInteraction: {
        __typename: 'PoiInteraction',
        id: localId,
        reference: 'Pending',
      },
    }),
  },
  ADD_POI_UPDATE: {
    document: ADD_POI_UPDATE,
    feature: 'poi',
    refetchQueries: ['GetPois', 'GetPoi'],
    buildOptimisticData: localId => ({
      addPoiUpdate: {__typename: 'PoiUpdate', id: localId, reference: 'Pending'},
    }),
  },
  // Unlike the three custody mutations below, a queued create has no record
  // yet — 'GetEquipmentDetail' is left out because there is no detail screen
  // for a row that doesn't exist. usePendingEquipmentItems projects the
  // placeholder into the list until this syncs.
  CREATE_EQUIPMENT: {
    document: CREATE_EQUIPMENT,
    feature: 'equipment',
    refetchQueries: ['GetEquipment', 'GetMyEquipment'],
    buildOptimisticData: localId => ({
      createEquipment: {
        __typename: 'EquipmentDetail',
        id: localId,
        reference: 'Pending',
      },
    }),
  },
  CHECK_OUT_EQUIPMENT: {
    document: CHECK_OUT_EQUIPMENT,
    feature: 'equipment',
    refetchQueries: ['GetEquipment', 'GetMyEquipment', 'GetEquipmentDetail'],
    buildOptimisticData: localId => ({
      checkOutEquipment: {
        __typename: 'EquipmentDetail',
        id: localId,
        reference: 'Pending',
      },
    }),
  },
  CHECK_IN_EQUIPMENT: {
    document: CHECK_IN_EQUIPMENT,
    feature: 'equipment',
    refetchQueries: ['GetEquipment', 'GetMyEquipment', 'GetEquipmentDetail'],
    buildOptimisticData: localId => ({
      checkInEquipment: {
        __typename: 'EquipmentDetail',
        id: localId,
        reference: 'Pending',
      },
    }),
  },
  ADD_EQUIPMENT_UPKEEP: {
    document: ADD_EQUIPMENT_UPKEEP,
    feature: 'equipment',
    refetchQueries: ['GetEquipment', 'GetMyEquipment', 'GetEquipmentDetail'],
    buildOptimisticData: localId => ({
      addEquipmentUpkeep: {
        __typename: 'EquipmentDetail',
        id: localId,
        reference: 'Pending',
      },
    }),
  },
};
