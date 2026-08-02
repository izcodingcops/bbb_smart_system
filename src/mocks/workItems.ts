import {QuickAction, WorkItem, WorkPriority} from '../types/work';
import {MOCK_MAINTENANCE_REQUESTS} from './maintenance';
import {MOCK_FIXTURES} from './fixture';

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
const MAINTENANCE_WORK_ITEMS: WorkItem[] = MOCK_MAINTENANCE_REQUESTS.map(
  (request, index) => ({
    id: request.id,
    reference: request.reference,
    category: 'Maintenance',
    status: request.status,
    date: request.requestedAt,
    type: request.type,
    priority: request.priority,
    zone: BUSINESS_ZONE[request.businessName] ?? `Zone ${(index % 5) + 1}`,
    assignee: request.assignee ? request.assignee.name : 'Pending',
    assigneeInitials: request.assignee ? request.assignee.initials : '—',
    address: request.address,
    bucket: request.status === 'Completed' ? 'completed' : 'assigned',
  }),
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

export const MOCK_WORK_ITEMS: WorkItem[] = [
  ...MAINTENANCE_WORK_ITEMS,
  ...FIXTURE_WORK_ITEMS,
];
