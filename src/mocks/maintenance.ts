// src/mocks/maintenance.ts
import {MaintenancePriority, MaintenanceRequest} from '../types/maintenance';

const ADDRESSES: Record<string, string> = {
  '16th St Mall': '16th St Mall, Denver, CO 80202',
  'Union Station': '1701 Wynkoop St, Denver, CO 80202',
  BlockByBlock: '1601 Wewatta St, Denver, CO 80202',
  'Larimer Square': '1430 Larimer St, Denver, CO 80202',
  'Denver Pavilions': '500 16th St, Denver, CO 80202',
};

const MARCUS = {name: 'Marcus Bell', initials: 'MB'};
const JOHN = {name: 'John Carter', initials: 'JC'};
const PRIYA = {name: 'Priya Shah', initials: 'PS'};
const ALEX = {name: 'Alex Nguyen', initials: 'AN'};

/** The 9 records the design screenshots pin exact values for. */
const ACTIVE: MaintenanceRequest[] = [
  {
    id: 'mt_40877',
    reference: '#MT-40877',
    type: 'Graffiti Removal',
    status: 'In-progress',
    requestedAt: '2026-07-06T08:40:00',
    businessName: '16th St Mall',
    priority: 'High',
    assignee: MARCUS,
    address: ADDRESSES['16th St Mall'],
    routedToSupervisor: false,
    queuedOffline: false,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Marcus Webb',
  },
  {
    id: 'mt_40855',
    reference: '#MT-40855',
    type: 'Streetlight Repair',
    status: 'Open',
    requestedAt: '2026-07-06T07:15:00',
    businessName: 'Union Station',
    priority: 'Medium',
    assignee: null,
    address: ADDRESSES['Union Station'],
    routedToSupervisor: true,
    queuedOffline: true,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Marcus Webb',
  },
  {
    id: 'mt_40822',
    reference: '#MT-40822',
    type: 'Alley Cleaning',
    status: 'In-progress',
    requestedAt: '2026-07-05T14:10:00',
    businessName: 'BlockByBlock',
    priority: 'High',
    assignee: JOHN,
    address: ADDRESSES.BlockByBlock,
    routedToSupervisor: false,
    queuedOffline: false,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Alicia Reyes',
  },
  {
    id: 'mt_40810',
    reference: '#MT-40810',
    type: 'Streetlight Repair',
    status: 'In-progress',
    requestedAt: '2026-07-05T10:25:00',
    businessName: 'Larimer Square',
    priority: 'Medium',
    assignee: PRIYA,
    address: ADDRESSES['Larimer Square'],
    routedToSupervisor: false,
    queuedOffline: false,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Marcus Webb',
  },
  {
    id: 'mt_40801',
    reference: '#MT-40801',
    type: 'Debris Removal',
    status: 'Open',
    requestedAt: '2026-07-04T09:20:00',
    businessName: 'Union Station',
    priority: 'High',
    assignee: ALEX,
    address: ADDRESSES['Union Station'],
    routedToSupervisor: false,
    queuedOffline: false,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Alicia Reyes',
  },
  {
    id: 'mt_40790',
    reference: '#MT-40790',
    type: 'Graffiti Removal',
    status: 'Open',
    requestedAt: '2026-07-04T11:05:00',
    businessName: 'BlockByBlock',
    priority: 'Medium',
    assignee: null,
    address: ADDRESSES.BlockByBlock,
    routedToSupervisor: true,
    queuedOffline: false,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Alicia Reyes',
  },
  {
    id: 'mt_40777',
    reference: '#MT-40777',
    type: 'Power Washing',
    status: 'Open',
    requestedAt: '2026-07-03T08:00:00',
    businessName: '16th St Mall',
    priority: 'Low',
    assignee: MARCUS,
    address: ADDRESSES['16th St Mall'],
    routedToSupervisor: false,
    queuedOffline: false,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Marcus Webb',
  },
  {
    id: 'mt_40762',
    reference: '#MT-40762',
    type: 'Alley Cleaning',
    status: 'Open',
    requestedAt: '2026-07-02T16:45:00',
    businessName: 'Larimer Square',
    priority: 'High',
    assignee: null,
    address: ADDRESSES['Larimer Square'],
    routedToSupervisor: false,
    queuedOffline: true,
    completedBy: null,
    assigneeKind: 'Department',
    department: 'Facilities Team',
    createdBy: 'Alicia Reyes',
  },
  {
    id: 'mt_40744',
    reference: '#MT-40744',
    type: 'Sidewalk Repair',
    status: 'Open',
    requestedAt: '2026-07-03T15:35:00',
    businessName: 'Denver Pavilions',
    priority: 'Low',
    assignee: null,
    address: ADDRESSES['Denver Pavilions'],
    routedToSupervisor: true,
    queuedOffline: false,
    completedBy: null,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Marcus Webb',
  },
];

const COMPLETED_TYPES = [
  'Power Washing',
  'Graffiti Removal',
  'Alley Cleaning',
  'Streetlight Repair',
  'Debris Removal',
];

const COMPLETED_BUSINESSES = Object.keys(ADDRESSES);
const COMPLETED_ASSIGNEES = [MARCUS, JOHN, PRIYA, ALEX];
const COMPLETED_PRIORITIES: MaintenancePriority[] = ['Low', 'Medium', 'High'];
const COMPLETED_CREATORS = ['Marcus Webb', 'Alicia Reyes'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Formats back to the same timezone-naive shape the explicit records use. */
function toLocalIso(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

const HOUR = 60 * 60 * 1000;
const COMPLETED_BASE = new Date('2026-07-04T16:00:00').getTime();

/**
 * Ids count down from 40700, staying clear of every explicit id above
 * (the lowest of those is #MT-40744), so no id can collide.
 */
const COMPLETED: MaintenanceRequest[] = Array.from({length: 24}, (_, i) => {
  const business = COMPLETED_BUSINESSES[i % COMPLETED_BUSINESSES.length];
  const assignee = COMPLETED_ASSIGNEES[i % COMPLETED_ASSIGNEES.length];
  return {
    id: `mt_${40700 - i * 3}`,
    reference: `#MT-${40700 - i * 3}`,
    type: COMPLETED_TYPES[i % COMPLETED_TYPES.length],
    status: 'Completed' as const,
    requestedAt: toLocalIso(new Date(COMPLETED_BASE - i * 7 * HOUR)),
    businessName: business,
    priority: COMPLETED_PRIORITIES[i % COMPLETED_PRIORITIES.length],
    assignee,
    address: ADDRESSES[business],
    routedToSupervisor: false,
    queuedOffline: false,
    completedBy: assignee.name,
    assigneeKind: 'Supervisor' as const,
    department: null,
    createdBy: COMPLETED_CREATORS[i % COMPLETED_CREATORS.length],
  };
});

export const MOCK_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  ...ACTIVE,
  {
    id: 'mt_40840',
    reference: '#MT-40840',
    type: 'Power Washing',
    status: 'Completed',
    requestedAt: '2026-07-05T17:30:00',
    businessName: '16th St Mall',
    priority: 'Medium',
    assignee: MARCUS,
    address: ADDRESSES['16th St Mall'],
    routedToSupervisor: false,
    queuedOffline: false,
    completedBy: MARCUS.name,
    assigneeKind: 'Supervisor',
    department: null,
    createdBy: 'Alicia Reyes',
  },
  ...COMPLETED,
];