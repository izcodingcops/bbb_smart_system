import {IncidentDetail, IncidentFormOptions} from '../types/incident';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Formats back to the same timezone-naive shape the other mocks use. */
function toLocalIso(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

const MINUTE = 60 * 1000;

/**
 * Captured once at module load. Every seeded date is expressed relative to it
 * — the same technique src/mocks/dispatch.ts uses — so the seed cannot go
 * stale the way three separate mock files in this app already have.
 */
const SEED_NOW = Date.now();

/** Midnight `dayOffset` days from the day `t` falls on, in the device timezone. */
function startOfDay(t: number, dayOffset: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.getTime();
}

/**
 * `minutes` into the day that fell `daysAgo` days ago — the mockup's own
 * clock times survive, while the calendar day rides the device clock.
 * Clamped to SEED_NOW so nothing is seeded into the future.
 */
function seedAt(daysAgo: number, minutes: number): string {
  const t = Math.min(startOfDay(SEED_NOW, -daysAgo) + minutes * MINUTE, SEED_NOW);
  return toLocalIso(new Date(t));
}

/** No responder involved — renders as four 'N/A' cells in the read model. */
const NO_RESPONDER = {name: null, responder: null, timeCalled: null, timeArrived: null};

/** Detail fields every record carries unless overridden. */
const DETAIL_DEFAULTS = {
  ambassador: null as string | null,
  createdBy: null as string | null,
  supervisorStatus: 'In Progress',
  lastModifiedBy: null as string | null,
  lastModifiedAt: null as string | null,
  describeLocation: null as string | null,
  latitude: null as string | null,
  longitude: null as string | null,
  fixture: null as string | null,
  description: null as string | null,
  documents: [] as string[],
  police: {...NO_RESPONDER},
  fire: {...NO_RESPONDER},
  ems: {...NO_RESPONDER},
  clientName: null as string | null,
  parties: [] as IncidentDetail['parties'],
  vehicles: [] as IncidentDetail['vehicles'],
  connectedMaintenance: [] as string[],
  connectedPois: [] as string[],
  connectedEquipment: [] as string[],
  comments: [] as IncidentDetail['comments'],
};

/** 'John Carter' → 'JC'. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function assigneeOf(name: string | null) {
  return name ? {name, initials: initials(name)} : null;
}

/**
 * The 13 records from the list mockup's own `RECORDS`, in the same order,
 * with `id` (the mockup's own reference-shaped id) renamed to `reference` and
 * a distinct opaque `id` invented — the id/reference swap is the first entry
 * in this module family's trap table, so the two must never be equal.
 * `dispatchReference: null` throughout: none of these came from a dispatch.
 */
export const MOCK_INCIDENTS: IncidentDetail[] = [
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42984', reference: '#IN-42984', type: 'Vandalism', priority: 'High',
    outcome: 'Police Notified', status: 'In-progress', assignee: assigneeOf('John Carter'),
    person: 'Unknown Male', businessName: '16th St Mall', zone: 'Zone 4',
    occurredAt: seedAt(0, 8 * 60 + 40), address: '16th St Mall, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
    // The Create form mockup's own rich example ('cm2') — chosen because its
    // type/priority/outcome/businessName/zone already match this record's own.
    ambassador: 'John Carter', createdBy: 'John Carter',
    lastModifiedBy: 'John Carter', lastModifiedAt: seedAt(0, 8 * 60 + 55),
    describeLocation: 'USA', fixture: 'Bench #B-204', description: 'Everything is going good',
    police: {name: 'Jack Son', responder: null, timeCalled: seedAt(0, 22 * 60 + 24), timeArrived: seedAt(0, 23 * 60 + 24)},
    parties: [{name: 'Jacob', type: 'Witness', organization: 'Jacob & Sons', streetAddress: 'Quebec J0T 2N0, Canada', phone: '+1 555-5555', email: 'jacob12@gmail.com'}],
    vehicles: [{year: '2021', make: 'Honda', model: 'Civic', color: 'Black', licenseNumber: 'SL139224'}],
    connectedMaintenance: ['Maintenance #96211407', 'Maintenance #96211'],
    connectedPois: ['POI #96211407'],
    connectedEquipment: ['Equipment #96211407'],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42960', reference: '#IN-42960', type: 'Medical Emergency', priority: 'High',
    outcome: 'EMS Called', status: 'Completed', assignee: assigneeOf('Marcus Bell'),
    person: 'J. Rivera', businessName: 'Union Station', zone: 'Zone 2',
    occurredAt: seedAt(0, 7 * 60 + 15), address: '1701 Wynkoop St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42931', reference: '#IN-42931', type: 'Theft', priority: 'Medium',
    outcome: 'Report Filed', status: 'In-progress', assignee: assigneeOf('John Carter'),
    person: 'None', businessName: 'Larimer Square', zone: 'Zone 1',
    occurredAt: seedAt(1, 17 * 60 + 30), address: '1430 Larimer St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42905', reference: '#IN-42905', type: 'Suspicious Activity', priority: 'Low',
    outcome: 'Monitored', status: 'Open', assignee: null,
    person: 'Unknown', businessName: 'Civic Center', zone: 'Zone 3',
    occurredAt: seedAt(1, 14 * 60 + 10), address: 'Civic Center Park, Denver, CO 80202',
    queuedOffline: true, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42888', reference: '#IN-42888', type: 'Trespassing', priority: 'Medium',
    outcome: 'Warning Issued', status: 'Completed', assignee: assigneeOf('Sara Diaz'),
    person: 'R. Blake', businessName: 'LoDo District', zone: 'Zone 5',
    occurredAt: seedAt(1, 11 * 60 + 5), address: '1601 Wewatta St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42860', reference: '#IN-42860', type: 'Property Damage', priority: 'High',
    outcome: 'Reported', status: 'Open', assignee: null,
    person: 'None', businessName: 'BlockByBlock', zone: 'Zone 4',
    occurredAt: seedAt(2, 16 * 60 + 20), address: '16th & Curtis St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42834', reference: '#IN-42834', type: 'Drug Activity', priority: 'High',
    outcome: 'Police Called', status: 'In-progress', assignee: assigneeOf('Marcus Bell'),
    person: 'Unknown Group', businessName: '16th St Mall', zone: 'Zone 4',
    occurredAt: seedAt(2, 10 * 60 + 50), address: '900 16th St Mall, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42810', reference: '#IN-42810', type: 'Disturbance', priority: 'Low',
    outcome: 'Resolved', status: 'Completed', assignee: assigneeOf('John Carter'),
    person: 'M. Ortiz', businessName: 'Union Station', zone: 'Zone 2',
    occurredAt: seedAt(3, 15 * 60 + 35), address: '1701 Wynkoop St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42788', reference: '#IN-42788', type: 'Graffiti', priority: 'Low',
    outcome: 'Documented', status: 'Open', assignee: assigneeOf('John Carter'),
    person: 'None', businessName: 'Larimer Square', zone: 'Zone 1',
    occurredAt: seedAt(3, 9 * 60 + 15), address: '1430 Larimer St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42760', reference: '#IN-42760', type: 'Assault', priority: 'High',
    outcome: 'EMS & Police', status: 'In-progress', assignee: assigneeOf('Sara Diaz'),
    person: 'D. Cole', businessName: 'Civic Center', zone: 'Zone 3',
    occurredAt: seedAt(4, 19 * 60 + 40), address: 'Civic Center Park, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42744', reference: '#IN-42744', type: 'Lost Property', priority: 'Low',
    outcome: 'Returned to Owner', status: 'Completed', assignee: assigneeOf('Ava Nguyen'),
    person: 'T. Wells', businessName: '16th St Mall', zone: 'Zone 2',
    occurredAt: seedAt(4, 13 * 60 + 20), address: '16th & Curtis St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42720', reference: '#IN-42720', type: 'Fire Hazard', priority: 'High',
    outcome: 'Fire Dept Notified', status: 'Completed', assignee: assigneeOf('Marcus Bell'),
    person: 'None', businessName: 'LoDo District', zone: 'Zone 5',
    occurredAt: seedAt(5, 8 * 60 + 5), address: '1601 Wewatta St, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42699', reference: '#IN-42699', type: 'Panhandling', priority: 'Low',
    outcome: 'Referred to Outreach', status: 'Open', assignee: assigneeOf('John Carter'),
    person: 'G. Fisher', businessName: 'Civic Center', zone: 'Zone 3',
    occurredAt: seedAt(6, 16 * 60 + 45), address: 'Civic Center Park, Denver, CO 80202',
    queuedOffline: false, dispatchReference: null,
  },
  // The two records Dispatch's own mocks seeded as `INCIDENT_1`/`INCIDENT_2`
  // (src/mocks/dispatch.ts) before absorption — carried over verbatim here
  // under the new numbering, with `dispatchReference` set to the dispatch
  // that created them. Task 12 deletes them from dispatch's own mocks; this
  // is their one remaining home. Neither ever had a routing assignee under
  // the old model, so both start unassigned like every other create.
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42986', reference: '#IN-42986', type: 'Narcan', priority: 'High',
    outcome: '911 CALLED', status: 'Open', assignee: null,
    person: 'None', businessName: 'StarX', zone: 'Waterfront Park',
    occurredAt: seedAt(0, 7 * 60 + 49), address: 'Lahore, Virginia, United States',
    queuedOffline: false, dispatchReference: 'dp_0000_06',
    ambassador: 'test user 99', createdBy: 'test user 99',
    lastModifiedBy: 'test user 99', lastModifiedAt: seedAt(0, 7 * 60 + 49),
    latitude: '31.5497', longitude: '74.3436', description: 'Again',
    police: {name: 'Jack Son', responder: null, timeCalled: seedAt(0, 7 * 60 + 40), timeArrived: seedAt(0, 7 * 60 + 45)},
    connectedEquipment: ['Equipment #4340'],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'inc_42987', reference: '#IN-42987', type: 'Welfare Check', priority: 'Medium',
    outcome: 'Referred to Outreach', status: 'In-progress', assignee: null,
    person: 'None', businessName: '16th St Mall', zone: 'Zone 2',
    occurredAt: seedAt(1, 21 * 60 + 40), address: '900 16th St Mall, Denver, CO 80202',
    queuedOffline: false, dispatchReference: 'dp_0000_11',
    ambassador: 'Marcus Bell', createdBy: 'Marcus Bell',
    lastModifiedBy: 'Marcus Bell', lastModifiedAt: seedAt(1, 21 * 60 + 40),
    supervisorStatus: 'In Progress', description: 'Subject accepted an outreach referral.',
  },
];

/** Every list the Create/Edit form offers, verbatim from the design's IncForm. */
export const MOCK_INCIDENT_FORM_OPTIONS: Omit<IncidentFormOptions, 'nextReference'> = {
  incidentTypes: [
    'Vandalism', 'Medical Emergency', 'Theft', 'Suspicious Activity', 'Trespassing',
    'Property Damage', 'Drug Activity', 'Disturbance', 'Graffiti', 'Assault',
    'Lost Property', 'Fire Hazard', 'Panhandling',
  ],
  outcomes: [
    'Police Notified', 'Police Called', 'EMS Called', 'EMS & Police', 'Report Filed',
    'Warning Issued', 'Reported', 'Monitored', 'Resolved', 'Documented',
    'Returned to Owner', 'Fire Dept Notified', 'Referred to Outreach',
  ],
  zones: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'],
  businessNames: ['16th St Mall', 'Union Station', 'Larimer Square', 'Civic Center', 'LoDo District', 'BlockByBlock'],
  fixtures: ['Bench #B-204', 'Trash Bin #T-88', 'Planter #P-12', 'Bike Rack #BR-5', 'Light Pole #LP-19'],
  partyTypes: ['Witness', 'Victim', 'Suspect', 'Bystander', 'Reporting Party', 'Other'],
  maintenanceOptions: ['Maintenance #96211407', 'Maintenance #96211', 'Maintenance #42984', 'Maintenance #42931'],
  poiOptions: ['POI #96211407', 'POI #96211', 'R. Blake', 'M. Ortiz', 'D. Cole'],
  equipmentOptions: ['Equipment #96211407', 'Equipment #96211', 'Tool Box', 'Pressure Washer'],
};
