import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {WorkItem} from '../../types/work';

interface CreateWorkLogVariables {
  input: {
    entryType: string;
    address: string;
    businessName?: string | null;
    quantity?: string | null;
  };
}

/**
 * Synthesizes a placeholder WorkItem for each Work Log create still sitting
 * in the outbox, so it shows in the Work tab's Activity list — with a
 * "Queued · offline" badge — before it has actually synced. Once
 * `flushOutbox()` syncs it, the outbox item disappears and so does this
 * placeholder; the refetch that same sync triggers brings in the real
 * record in its place.
 */
export function usePendingWorkLogItems(): WorkItem[] {
  const outboxItems = GetOutboxItems();

  return useMemo(
    () =>
      outboxItems
        .filter(item => item.mutationKey === 'CREATE_WORK_LOG_ENTRY')
        .map((item): WorkItem => {
          const variables = item.variables as unknown as CreateWorkLogVariables;
          return {
            id: item.id,
            reference: 'Pending',
            category: 'Activity',
            status: 'Completed',
            date: item.createdAt,
            type: variables.input.entryType,
            priority: 'Low',
            zone: 'Zone 1',
            assignee: 'You',
            assigneeInitials: 'YO',
            address: variables.input.address,
            bucket: 'completed',
            businessName: variables.input.businessName ?? undefined,
            quantity: variables.input.quantity ?? undefined,
            queuedOffline: true,
          };
        }),
    [outboxItems],
  );
}
