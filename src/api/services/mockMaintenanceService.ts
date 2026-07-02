import {
  MaintenanceRecord,
  MaintenancePayload,
  MaintenanceDropdowns,
  MaintenanceListFilters,
  MaintenanceComment,
} from '../../types/maintenance';
import {generateId} from '../../utils/generateId';
import {MaintenanceServiceContract} from './contracts';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

function generateTicketNumber(): string {
  return `#${Math.floor(10000000 + Math.random() * 89999999)}`;
}

const dropdowns: MaintenanceDropdowns = {
  types: [
    {id: 'alley-cleaning', label: 'Alley Cleaning'},
    {id: 'casey-reily', label: 'Casey Reily'},
    {id: 'chad-ferry', label: 'Chad Ferry'},
    {id: 'graffiti-removal', label: 'Graffiti Removal'},
    {id: 'lighting-repair', label: 'Lighting Repair'},
    {id: 'sidewalk-repair', label: 'Sidewalk Repair'},
  ],
  departments: [
    {id: 'dept-operations', label: 'Operations'},
    {id: 'dept-facilities', label: 'Facilities'},
    {id: 'dept-security', label: 'Security'},
  ],
  ambassadors: [
    {id: 'amb-tom-lee', label: 'Tom Lee'},
    {id: 'amb-jack-son', label: 'Jack Son'},
    {id: 'amb-the-rock', label: 'The Rock'},
    {id: 'amb-john-david', label: 'John David'},
    {id: 'amb-lee-bauch', label: 'Lee Bauch'},
    {id: 'amb-blake-thomas', label: 'Blake Thomas'},
    {id: 'amb-jimmy-picacho', label: 'Jimmy Picacho'},
    {id: 'amb-joy-trump', label: 'Joy Trump'},
    {id: 'amb-karen-smith', label: 'Karen Smith'},
  ],
  businesses: [
    {id: 'biz-stark', label: 'StarK'},
    {id: 'biz-blue-bottle', label: 'Blue Bottle Coffee'},
    {id: 'biz-corner-market', label: 'Corner Market'},
  ],
  zones: [
    {id: 'zone-1', label: 'Zone 1'},
    {id: 'zone-2', label: 'Zone 2'},
    {id: 'zone-3', label: 'Zone 3'},
  ],
};

function seedRecords(): MaintenanceRecord[] {
  return [
    {
      id: 'seed-1',
      ticket_number: '#96211407',
      status: 'Open',
      maintenance_type_id: 'alley-cleaning',
      request_date: '2026-02-05T11:00:00.000Z',
      assignee_type: 'Ambassador',
      user_id: 'amb-tom-lee',
      priority: 'High',
      address: '45.821, -74.198',
      zone_id: 'zone-1',
      location_description: 'N/A',
      business_location: 'biz-stark',
      description: 'Overflowing bins attracting pests behind the loading dock.',
      latitude: 45.821,
      longitude: -74.198,
      program_name: 'Louisville Ivy Training',
      created_by: 'David',
      completed_by: null,
      completed_on: null,
      payment_status: 'Un-Paid',
      created_at: '2026-02-21T10:05:00.000Z',
    },
    {
      id: 'seed-2',
      ticket_number: '#84302219',
      status: 'InProgress',
      maintenance_type_id: 'graffiti-removal',
      request_date: '2026-02-10T09:30:00.000Z',
      assignee_type: 'Department',
      department_id: 'dept-facilities',
      priority: 'Medium',
      address: '45.502, -73.567',
      zone_id: 'zone-2',
      location_description: 'Wall facing the alley entrance',
      business_location: 'biz-blue-bottle',
      description: 'Graffiti tags on the north wall need repainting.',
      latitude: 45.502,
      longitude: -73.567,
      program_name: 'Downtown Cleanup',
      created_by: 'Sarah',
      completed_by: null,
      completed_on: null,
      payment_status: 'Un-Paid',
      created_at: '2026-02-18T14:22:00.000Z',
    },
    {
      id: 'seed-3',
      ticket_number: '#71183345',
      status: 'Completed',
      maintenance_type_id: 'lighting-repair',
      request_date: '2026-01-28T16:00:00.000Z',
      assignee_type: 'Ambassador',
      user_id: 'amb-jack-son',
      priority: 'Low',
      address: '45.494, -73.577',
      zone_id: 'zone-3',
      location_description: 'N/A',
      business_location: 'biz-corner-market',
      description: 'Streetlight flickering outside the entrance.',
      latitude: 45.494,
      longitude: -73.577,
      program_name: 'Downtown Cleanup',
      created_by: 'David',
      completed_by: 'Jack Son',
      completed_on: '2026-02-01T10:00:00.000Z',
      payment_status: 'Paid',
      created_at: '2026-01-29T08:15:00.000Z',
    },
  ];
}

let records: MaintenanceRecord[] = seedRecords();
let commentsByRecord: Record<string, MaintenanceComment[]> = {};

function matchesFilters(record: MaintenanceRecord, filters: MaintenanceListFilters): boolean {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const haystack = `${record.ticket_number} ${record.description ?? ''}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.priority && record.priority !== filters.priority) return false;
  if (filters.status && record.status !== filters.status) return false;
  if (filters.type && String(record.maintenance_type_id) !== filters.type) return false;
  if (filters.business && String(record.business_location) !== filters.business) return false;
  return true;
}

const mockMaintenanceServiceContract = {
  list: (_page: number, filters: MaintenanceListFilters) => {
    const rows = records.filter(record => matchesFilters(record, filters));
    return delay({status: 200, data: {count: rows.length, rows}});
  },

  detail: (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) {
      return Promise.reject(new Error('Maintenance request not found.'));
    }
    return delay({status: 200, data: record});
  },

  create: (payload: MaintenancePayload) => {
    const record: MaintenanceRecord = {
      ...payload,
      id: generateId(),
      ticket_number: generateTicketNumber(),
      status: 'Open',
      payment_status: 'Un-Paid',
      completed_by: null,
      completed_on: null,
      created_by: 'You',
      created_at: new Date().toISOString(),
    };
    records = [record, ...records];
    return delay({status: 201, data: record});
  },

  update: (id: string, payload: MaintenancePayload) => {
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      return Promise.reject(new Error('Maintenance request not found.'));
    }
    records[index] = {...records[index], ...payload};
    return delay({status: 200, data: records[index]});
  },

  remove: (id: string) => {
    records = records.filter(r => r.id !== id);
    delete commentsByRecord[id];
    return delay({status: 200});
  },

  getDropdowns: () => delay({status: 200, data: dropdowns}),

  addComment: (id: string, text: string) => {
    const comment: MaintenanceComment = {
      id: generateId(),
      text,
      created_at: new Date().toISOString(),
      created_by: 'You',
    };
    commentsByRecord[id] = [...(commentsByRecord[id] ?? []), comment];
    return delay({status: 200, data: comment});
  },

} satisfies MaintenanceServiceContract;

export const mockMaintenanceService = {
  ...mockMaintenanceServiceContract,
  __reset: () => {
    records = seedRecords();
    commentsByRecord = {};
  },
};
