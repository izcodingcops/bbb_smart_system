import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {MaintenancePriority, MaintenanceRequest} from '../../types/maintenance';

interface CreateMaintenanceVariables {
  input: {
    type: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    address: string;
    businessName: string | null;
  };
}

const PRIORITY: Record<'LOW' | 'MEDIUM' | 'HIGH', MaintenancePriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/**
 * Synthesizes a placeholder MaintenanceRequest for each create still sitting
 * in the outbox. `assignee: null` matches the mock resolver's own creation
 * default (maintenance/resolvers.ts createMaintenanceRequest — "a supervisor
 * assigns it later") and is what already keeps MaintenanceCard's status menu
 * disabled for it via canChangeStatus, with no separate interaction guard
 * needed here, unlike Fixture. Mirrors usePendingWorkLogItems in
 * src/screens/work/pendingWorkItems.ts.
 */
export function usePendingMaintenanceItems(): MaintenanceRequest[] {
  const outboxItems = GetOutboxItems();

  return useMemo(
    () =>
      outboxItems
        .filter(item => item.mutationKey === 'CREATE_MAINTENANCE_REQUEST')
        .map((item): MaintenanceRequest => {
          const variables = item.variables as unknown as CreateMaintenanceVariables;
          return {
            id: item.id,
            reference: 'Pending',
            type: variables.input.type,
            status: 'Open',
            requestedAt: item.createdAt,
            businessName: variables.input.businessName ?? '',
            priority: PRIORITY[variables.input.priority],
            assignee: null,
            address: variables.input.address,
            routedToSupervisor: true,
            queuedOffline: true,
            completedBy: null,
            assigneeKind: 'Supervisor',
            department: null,
            createdBy: 'You',
          };
        }),
    [outboxItems],
  );
}
