import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {
  DispatchIncident,
  DispatchPriority,
  DispatchResponderInfo,
} from '../../types/dispatch';

interface ResponderVariables {
  name: string | null;
  responder: string | null;
  timeCalled: string | null;
  timeArrived: string | null;
}

interface PartyVariables {
  name: string | null;
  type: string | null;
  organization: string | null;
  streetAddress: string | null;
  phone: string | null;
  email: string | null;
}

interface VehicleVariables {
  year: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  licenseNumber: string | null;
}

interface CreateDispatchIncidentVariables {
  dispatchId: string;
  input: {
    incidentType: string;
    occurredAt: string;
    outcome: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    address: string;
    describeLocation: string | null;
    zone: string | null;
    businessName: string | null;
    notes: string | null;
    documentCount: number;
    reportStatus: string;
    supervisorStatus: string;
    police: ResponderVariables | null;
    fire: ResponderVariables | null;
    ems: ResponderVariables | null;
    clientName: string | null;
    parties: PartyVariables[];
    vehicles: VehicleVariables[];
    fixture: string | null;
    connectedMaintenance: string[];
    connectedPois: string[];
    connectedEquipment: string[];
  };
}

const PRIORITY: Record<'LOW' | 'MEDIUM' | 'HIGH', DispatchPriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const NOT_INVOLVED: DispatchResponderInfo = {
  name: null,
  responder: null,
  timeCalled: null,
  timeArrived: null,
};

const toResponderInfo = (block: ResponderVariables | null): DispatchResponderInfo =>
  block
    ? {
        name: block.name,
        responder: block.responder,
        timeCalled: block.timeCalled,
        timeArrived: block.timeArrived,
      }
    : NOT_INVOLVED;

/**
 * Synthesizes a placeholder DispatchIncident for each create still sitting in
 * the outbox for this dispatch, so it shows in the Incident tab — clearly
 * marked as not yet uploaded — before it has actually synced. Mirrors
 * usePendingFixtureItems in src/screens/fixture/pendingFixtureItems.ts. Once
 * flushOutbox() syncs it, the outbox item disappears and so does this
 * placeholder; the refetch that same sync triggers brings in the real
 * record in its place.
 *
 * Unlike Fixture and MaintenanceRequest, DispatchIncident has no
 * server-modeled `queuedOffline` field — see its doc comment in
 * src/types/dispatch.ts. This hook is the one place that sets it, the same
 * way usePendingWorkLogItems does for WorkItem's own client-only flag.
 */
export function usePendingDispatchIncidents(dispatchId: string): DispatchIncident[] {
  const outboxItems = GetOutboxItems();

  return useMemo(
    () =>
      outboxItems
        .filter(item => {
          if (item.mutationKey !== 'CREATE_DISPATCH_INCIDENT') {
            return false;
          }
          const variables = item.variables as unknown as CreateDispatchIncidentVariables;
          return variables.dispatchId === dispatchId;
        })
        .map((item): DispatchIncident => {
          const {input} = item.variables as unknown as CreateDispatchIncidentVariables;
          return {
            id: item.id,
            // Never a real reference — nothing has been assigned one yet.
            reference: 'Pending',
            label: 'Pending',
            createdBy: 'You',
            priority: PRIORITY[input.priority],
            incidentType: input.incidentType,
            occurredAt: input.occurredAt,
            outcome: input.outcome,
            notes: input.notes,

            ambassador: null,
            reportStatus: input.reportStatus,
            supervisorStatus: input.supervisorStatus,
            address: input.address,
            describeLocation: input.describeLocation,
            latitude: null,
            longitude: null,
            zone: input.zone,
            businessName: input.businessName,
            fixture: input.fixture,
            documentCount: input.documentCount,
            lastModifiedBy: null,
            lastModifiedAt: null,

            police: toResponderInfo(input.police),
            fire: toResponderInfo(input.fire),
            ems: toResponderInfo(input.ems),
            clientName: input.clientName,

            parties: input.parties,
            vehicles: input.vehicles,

            connectedMaintenance: input.connectedMaintenance,
            connectedPois: input.connectedPois,
            connectedEquipment: input.connectedEquipment,

            queuedOffline: true,
          };
        }),
    [outboxItems, dispatchId],
  );
}
