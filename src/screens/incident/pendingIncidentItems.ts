import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {IncidentDetail, IncidentPriority} from '../../types/incident';

interface CreateIncidentVariables {
  programId: string;
  input: {
    incidentType: string;
    outcome: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    address: string;
    businessName: string | null;
    zone: string | null;
    description: string | null;
    parties: {name: string | null}[];
  };
  dispatchReference: string | null;
}

const PRIORITY: Record<'LOW' | 'MEDIUM' | 'HIGH', IncidentPriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const NO_RESPONDER = {name: null, responder: null, timeCalled: null, timeArrived: null};

/**
 * Synthesizes a placeholder IncidentDetail for each create still sitting in
 * the outbox — full detail, not just the list-card shape, the same way the
 * old `usePendingDispatchIncidents` always built a full `DispatchIncident`:
 * IncidentAccordion (Task 13) reads `createdBy`/`description` off a pending
 * item in Dispatch's own "Pending Upload" band, same as a synced one.
 * `assignee: null` matches the mock resolver's own creation default ("a
 * supervisor assigns it later"), which already keeps IncidentCard's status
 * menu disabled for it via canChangeStatus. Mirrors usePendingMaintenanceItems
 * in src/screens/maintenance/pendingMaintenanceItems.ts. The Incident tab
 * uses this unfiltered; Dispatch (Task 13) filters it by `dispatchReference`.
 */
export function usePendingIncidentItems(): IncidentDetail[] {
  const outboxItems = GetOutboxItems();

  return useMemo(
    () =>
      outboxItems
        .filter(item => item.mutationKey === 'CREATE_INCIDENT')
        .map((item): IncidentDetail => {
          const variables = item.variables as unknown as CreateIncidentVariables;
          const {input} = variables;
          return {
            id: item.id,
            reference: 'Pending',
            type: input.incidentType,
            outcome: input.outcome,
            priority: PRIORITY[input.priority],
            status: 'Open',
            occurredAt: item.createdAt,
            assignee: null,
            person: input.parties[0]?.name || 'None',
            businessName: input.businessName ?? '',
            zone: input.zone ?? '',
            address: input.address,
            queuedOffline: true,
            dispatchReference: variables.dispatchReference,
            ambassador: 'You',
            createdBy: 'You',
            supervisorStatus: 'In Progress',
            lastModifiedBy: 'You',
            lastModifiedAt: item.createdAt,
            describeLocation: null,
            latitude: null,
            longitude: null,
            fixture: null,
            description: input.description,
            documents: [],
            police: {...NO_RESPONDER},
            fire: {...NO_RESPONDER},
            ems: {...NO_RESPONDER},
            clientName: null,
            parties: [],
            vehicles: [],
            connectedMaintenance: [],
            connectedPois: [],
            connectedEquipment: [],
            comments: [],
          };
        }),
    [outboxItems],
  );
}
