import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {Fixture, FixtureStatus} from '../../types/fixture';

interface CreateFixtureVariables {
  input: {
    title: string;
    fixtureType: string;
    status: 'ACTIVE' | 'INACTIVE';
    address: string;
    zone: string;
  };
}

const STATUS: Record<'ACTIVE' | 'INACTIVE', FixtureStatus> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

/**
 * Synthesizes a placeholder Fixture for each create still sitting in the
 * outbox, so it shows in the list — with a "Queued · offline" badge — before
 * it has actually synced. Mirrors usePendingWorkLogItems in
 * src/screens/work/pendingWorkItems.ts. Once flushOutbox() syncs it, the
 * outbox item disappears and so does this placeholder; the refetch that
 * same sync triggers brings in the real record in its place.
 */
export function usePendingFixtureItems(): Fixture[] {
  const outboxItems = GetOutboxItems();

  return useMemo(
    () =>
      outboxItems
        .filter(item => item.mutationKey === 'CREATE_FIXTURE')
        .map((item): Fixture => {
          const variables = item.variables as unknown as CreateFixtureVariables;
          return {
            id: item.id,
            reference: 'Pending',
            title: variables.input.title,
            fixtureType: variables.input.fixtureType,
            zone: variables.input.zone,
            status: STATUS[variables.input.status],
            // Matches the mock resolver's own creator convention
            // (fixture/resolvers.ts createFixture).
            createdBy: {name: 'You', initials: 'YO'},
            queuedOffline: true,
            createdAt: item.createdAt,
            address: variables.input.address,
          };
        }),
    [outboxItems],
  );
}
