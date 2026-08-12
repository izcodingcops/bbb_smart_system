import {QuickAction, WorkItem, WorkPriority} from '../types/work';
import {WorkLogEntry} from '../types/workLog';
import {MaintenanceRequest} from '../types/maintenance';
import {MOCK_MAINTENANCE_REQUESTS} from './maintenance';
import {MOCK_FIXTURES} from './fixture';
import {MOCK_WORK_LOG_ENTRIES} from './workLog';

export const MOCK_QUICK_ACTIONS = [
  {
    id: 'qa1',
    label: 'Add Graffiti',
    tint: '#DCEBFF',
    iconColor: '#0066B2',
    icon: 'graffiti',
  },
  {
    id: 'qa2',
    label: 'Add Elevator Check',
    tint: '#FBE3D6',
    iconColor: '#C4501F',
    icon: 'elevator',
  },
  {
    id: 'qa3',
    label: 'Add Litter Pickup',
    tint: '#FBEFD1',
    iconColor: '#B07D12',
    icon: 'litter',
  },
  {
    id: 'qa4',
    label: 'Add Inspection',
    tint: '#E2E7F5',
    iconColor: '#4A5A8A',
    icon: 'inspection',
  },
] satisfies QuickAction[];

/** Maintenance records carry a business name, not a zone — this fills the gap. */
const BUSINESS_ZONE: Record<string, string> = {
  '16th St Mall': 'Zone 1',
  'Union Station': 'Zone 2',
  BlockByBlock: 'Zone 4',
  'Larimer Square': 'Zone 5',
  'Denver Pavilions': 'Zone 3',
};

/** Fixtures don't carry a priority — cycled deterministically for card display. */
const FIXTURE_PRIORITIES: WorkPriority[] = ['Low', 'Medium', 'High'];

/**
 * Work items are the same records shown on the Maintenance and Fixture tabs,
 * reshaped for the shared card. Sharing the id keeps a tap on a Work card
 * routable to the real ViewMaintenanceScreen/ViewFixtureScreen.
 */
export function toMaintenanceWorkItem(
  request: MaintenanceRequest,
  index: number,
): WorkItem {
  const isUnassigned =
    request.assigneeKind === 'Supervisor' &&
    !request.assignee &&
    request.status !== 'Completed';
  return {
    id: request.id,
    reference: request.reference,
    category: 'Maintenance',
    status: request.status,
    date: request.requestedAt,
    type: request.type,
    priority: request.priority,
    zone: BUSINESS_ZONE[request.businessName] ?? `Zone ${(index % 5) + 1}`,
    assignee: request.assignee
      ? request.assignee.name
      : request.assigneeKind === 'Department'
      ? request.department ?? 'Department'
      : 'Unassigned',
    assigneeInitials: request.assignee ? request.assignee.initials : '—',
    address: request.address,
    createdBy: request.createdBy,
    bucket: isUnassigned
      ? 'unassigned'
      : request.status === 'Completed'
      ? 'completed'
      : 'assigned',
  };
}

const MAINTENANCE_WORK_ITEMS: WorkItem[] = MOCK_MAINTENANCE_REQUESTS.map(
  toMaintenanceWorkItem,
);

/**
 * Fixture records have no workflow status of their own — an Active fixture
 * reads as logged/completed work, an Inactive one as still needing attention.
 */
const FIXTURE_WORK_ITEMS: WorkItem[] = MOCK_FIXTURES.map((fixture, index) => ({
  id: fixture.id,
  reference: fixture.reference,
  category: 'Fixture',
  status: fixture.status === 'Active' ? 'Completed' : 'Open',
  date: fixture.createdAt,
  type: fixture.fixtureType,
  priority: FIXTURE_PRIORITIES[index % FIXTURE_PRIORITIES.length],
  zone: fixture.zone,
  assignee: fixture.createdBy.name,
  assigneeInitials: fixture.createdBy.initials,
  address: fixture.address,
  bucket: fixture.status === 'Active' ? 'completed' : 'assigned',
  outcome: fixture.status,
}));

/** 'Marcus Bell' -> 'MB', 'You' -> 'YO' — same shape as Fixture's createdBy.initials. */
function initialsOf(name: string): string {
  if (name === 'You') {
    return 'YO';
  }
  const parts = name.split(' ').filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

/** Work Log entries have no priority concept — cycled deterministically, same as Fixture. */
const WORKLOG_PRIORITIES: WorkPriority[] = ['Low', 'Medium', 'High'];

/** Deterministic from the id rather than array position, so the cycling stays
 *  stable when this runs live against workLogStore.records, whose order shifts
 *  as entries are created (unshifted to the front) and deleted. */
function priorityFor(id: string): WorkPriority {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return WORKLOG_PRIORITIES[sum % WORKLOG_PRIORITIES.length];
}

/**
 * Work Log entries are self-reported completed work, not assignable tasks —
 * every one lands in the 'completed' bucket with status 'Completed', same
 * treatment an Active fixture gets.
 *
 * Exported so the `work` GraphQL feature can map `workLogStore.records` the
 * same way at query time — the Work Log store is mutated in place by its own
 * create/update/delete mutations, so a WorkItem list built once from this
 * module's static MOCK_WORK_LOG_ENTRIES would never reflect them.
 */
export function toWorkLogWorkItem(entry: WorkLogEntry): WorkItem {
  return {
    id: entry.id,
    reference: entry.reference,
    category: 'Activity',
    status: 'Completed',
    date: entry.createdAt,
    type: entry.entryType,
    priority: priorityFor(entry.id),
    zone: entry.zone ?? 'Zone 1',
    assignee: entry.loggedBy,
    assigneeInitials: initialsOf(entry.loggedBy),
    address: entry.address,
    bucket: 'completed',
    businessName: entry.businessName ?? undefined,
    quantity: entry.quantity,
  };
}

const WORKLOG_WORK_ITEMS: WorkItem[] = MOCK_WORK_LOG_ENTRIES.map(toWorkLogWorkItem);

export const MOCK_WORK_ITEMS: WorkItem[] = [
  ...MAINTENANCE_WORK_ITEMS,
  ...FIXTURE_WORK_ITEMS,
  ...WORKLOG_WORK_ITEMS,
];
