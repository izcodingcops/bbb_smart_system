import {MaintenanceDetail} from '../../../types/maintenance';
import {MOCK_MAINTENANCE_REQUESTS} from '../../../mocks/maintenance';

/** Option lists from the design — also served by maintenanceFormOptions. */
export const MAINT_TYPES = [
  'Graffiti Removal',
  'Power Washing',
  'Alley Cleaning',
  'Streetlight Repair',
  'Debris Removal',
  'Bench Repair',
  'Trash Receptacle Repair',
  'Sidewalk Repair',
  'Planter Maintenance',
  'Snow / Ice Removal',
];
export const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
export const DEPARTMENTS = [
  'Tom Lee department',
  'Facilities Team',
  'Grounds & Maintenance',
  'Sanitation Crew',
];
export const BUSINESS_NAMES = [
  '16th St Mall',
  'Union Station',
  'Larimer Square',
  'Civic Center',
  'BlockByBlock',
  'LoDo District',
];
export const FIXTURES = [
  'Bench #B-204',
  'Trash Bin #T-88',
  'Planter #P-12',
  'Bike Rack #BR-5',
  'Light Pole #LP-19',
];
export const INCIDENTS = [
  'Graffiti — 07/04/2026',
  'Vandalism — 07/03/2026',
  'Property Damage — 07/02/2026',
  'Trespassing — 07/01/2026',
];
export const POIS = ['R. Blake', 'M. Ortiz', 'D. Cole', 'T. Wells', 'G. Fisher'];
export const EQUIPMENT = [
  'Hammer',
  'Tool Box',
  'Pressure Washer',
  'Ladder',
  'Paint Kit',
];
export const FIXTURE_TYPES = [
  'Floor Fixture',
  'Bench',
  'Bike Rack',
  'Planter',
  'Trash Receptacle',
  'Light Pole',
  'Bollard',
  'Sign Post',
  'Kiosk',
  'Drinking Fountain',
];

const DETAIL_DEFAULTS = {
  ambassador: 'Tom Lee',
  programName: 'Louisville KY Training',
  programCode: 'BBB 0000',
  createdBy: 'David',
  completedOn: null as string | null,
  paid: false,
  assigneeKind: 'Supervisor' as const,
  department: null as string | null,
  zone: null as string | null,
  describeLocation: null as string | null,
  description: null as string | null,
  documents: [] as string[],
  fixture: null as string | null,
  incidents: [] as string[],
  pois: [] as string[],
  equipment: [] as string[],
  comments: [] as MaintenanceDetail['comments'],
};

/** Seeded once per app session; mutations edit these arrays in place. */
export const maintenanceStore: {
  records: MaintenanceDetail[];
  fixtures: string[];
} = {
  records: MOCK_MAINTENANCE_REQUESTS.map(request => ({
    ...DETAIL_DEFAULTS,
    ...request,
    completedOn: request.status === 'Completed' ? request.requestedAt : null,
    paid: request.status === 'Completed',
    comments:
      request.id === '#MT-40840'
        ? [
            {
              id: 'c1',
              createdAt: '2026-04-20T12:15:00',
              text: 'Need to upload all documents',
              edited: false,
              images: [],
            },
          ]
        : [],
  })),
  fixtures: [...FIXTURES],
};

export function findRecord(id: string): MaintenanceDetail | undefined {
  return maintenanceStore.records.find(r => r.id === id);
}

/** One past the highest existing number, so created records sort to the top. */
export function nextReference(): string {
  const max = maintenanceStore.records.reduce((acc, r) => {
    const n = Number(r.id.replace('#MT-', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `#MT-${max + 1}`;
}
