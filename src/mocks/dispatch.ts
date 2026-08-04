import {
  DispatchDetail,
  DispatchEscalation,
  DispatchIncident,
  DispatchIncidentFormOptions,
  DispatchPriority,
  DispatchStatus,
} from '../types/dispatch';

/** No responder involved — the shape the mockup renders as four 'N/A' cells. */
const NO_RESPONDER = {
  name: null,
  responder: null,
  timeCalled: null,
  timeArrived: null,
};

/** Detail fields every record carries, overridden per record where the source differs. */
const DETAIL_DEFAULTS = {
  createdBy: 'Ahsann Rizvi',
  sourceNotes: null as string | null,
  locationNotes: null as string | null,
  tagSelected: null as string | null,
  classificationNotes: null as string | null,
  assignedRole: 'Ambassador' as string | null,
  assignedIndividual: null as string | null,
  timeDispatched: null as string | null,
  timeArrived: null as string | null,
  timeCleared: null as string | null,
  initialOutcome: null as string | null,
  fullSquadResponse: 'No' as string | null,
  outcomeNotes: null as string | null,
  escalations: [] as DispatchEscalation[],
  incidents: [] as DispatchIncident[],
};

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

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Captured once at module load. Every seeded date is expressed relative to it,
 * so the seed cannot go stale the way the original absolute July literals did:
 * three of the five Date Range buckets were empty within four days of the
 * module shipping.
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
 * `minutes` into the day that fell `daysAgo` days ago — so the mockup's own
 * clock times survive, while the calendar day rides the device clock.
 *
 * Clamped to SEED_NOW: without it, a record seeded at "today 07:34" would sit
 * in the future for anyone opening the app before 07:34, and the app would
 * show dispatches that had not happened yet.
 */
function seedAt(daysAgo: number, minutes: number): string {
  const t = Math.min(startOfDay(SEED_NOW, -daysAgo) + minutes * MINUTE, SEED_NOW);
  return toLocalIso(new Date(t));
}

/**
 * Three days back at 06:00 — just under the oldest explicit record, so
 * generated rows sort below them. Stepping back 7h each covers roughly six
 * further days, putting the oldest around nine days ago: far enough that
 * Last 30 days reaches records Last 7 days does not.
 */
const GEN_BASE = new Date(seedAt(3, 6 * 60)).getTime();

/**
 * The mockup's single fully-populated incident, on dispatch #BBB-D 0000-06.
 *
 * The source mockup dates this incident 8 days after its parent dispatch
 * (07/10/2026 vs. 07/02/2026) — a mockup artifact, not a domain rule. It is
 * pinned to the parent's own day instead, so no seeded record lands in the
 * future against a live clock. The police-before-incident ordering within the
 * same day is left as-is; that oddity is harmless.
 */
const INCIDENT_1: DispatchIncident = {
  id: '1496371',
  reference: '#96211407',
  label: 'Incident 1',
  createdBy: 'test user 99',
  priority: 'High',
  incidentType: 'Narcan',
  occurredAt: seedAt(0, 7 * 60 + 49),
  outcome: '911 CALLED',
  notes: 'Again',
  ambassador: 'test user 99',
  reportStatus: 'Open',
  supervisorStatus: 'In Progress',
  address: 'Lahore, Virginia, United States',
  describeLocation: null,
  latitude: '31.5497',
  longitude: '74.3436',
  zone: 'Waterfront Park',
  businessName: 'StarX',
  fixture: null,
  documentCount: 0,
  lastModifiedBy: 'test user 99',
  lastModifiedAt: seedAt(0, 7 * 60 + 49),
  police: {
    name: 'Jack Son',
    responder: null,
    timeCalled: seedAt(0, 7 * 60 + 40),
    timeArrived: seedAt(0, 7 * 60 + 45),
  },
  fire: {...NO_RESPONDER},
  ems: {...NO_RESPONDER},
  clientName: null,
  parties: [],
  vehicles: [],
  connectedMaintenance: [],
  connectedPois: [],
  connectedEquipment: ['Equipment #4340'],
};

/**
 * A second, sparser incident on a different dispatch — the accordion list is
 * otherwise only ever length 1, and the empty responder blocks exercise the
 * 'N/A' rendering the read sheet does for a No answer.
 */
const INCIDENT_2: DispatchIncident = {
  id: '1496402',
  reference: '#96211412',
  label: 'Incident 1',
  createdBy: 'Marcus Bell',
  priority: 'Medium',
  incidentType: 'Welfare Check',
  occurredAt: seedAt(1, 21 * 60 + 40),
  outcome: 'Referred to Outreach',
  notes: 'Subject accepted an outreach referral.',
  ambassador: 'Marcus Bell',
  reportStatus: 'In Progress',
  supervisorStatus: 'In Progress',
  address: '900 16th St Mall, Denver, CO 80202',
  describeLocation: null,
  latitude: null,
  longitude: null,
  zone: 'Zone 2',
  businessName: '16th St Mall',
  fixture: null,
  documentCount: 0,
  lastModifiedBy: 'Marcus Bell',
  lastModifiedAt: seedAt(1, 21 * 60 + 40),
  police: {...NO_RESPONDER},
  fire: {...NO_RESPONDER},
  ems: {...NO_RESPONDER},
  clientName: null,
  parties: [],
  vehicles: [],
  connectedMaintenance: [],
  connectedPois: [],
  connectedEquipment: [],
};

/** The mockup's single escalation, on the same dispatch. */
const ESCALATION_EMS: DispatchEscalation = {
  id: 'esc_0000_06_1',
  label: 'EMS',
  type: 'EMS',
  respondingPerson: 'test',
  timeCalled: seedAt(0, 4 * 60 + 18),
  timeArrived: seedAt(0, 4 * 60 + 18),
  timeCleared: null,
  status: 'Open',
  notes: 'test',
};

/** A second, fuller escalation so the accordion list is exercised with two. */
const ESCALATION_POLICE: DispatchEscalation = {
  id: 'esc_0000_11_1',
  label: 'Police',
  type: 'Police',
  respondingPerson: 'Officer D. Reyes',
  timeCalled: seedAt(1, 21 * 60 + 20),
  timeArrived: seedAt(1, 21 * 60 + 31),
  timeCleared: seedAt(1, 22 * 60 + 5),
  status: 'Open',
  notes: 'Subject transported for evaluation.',
};

const ESCALATION_FIRE: DispatchEscalation = {
  id: 'esc_0000_08_1',
  label: 'Fire',
  type: 'Fire',
  respondingPerson: 'Engine 12',
  timeCalled: seedAt(1, 15 * 60 + 52),
  timeArrived: seedAt(1, 16 * 60 + 4),
  timeCleared: null,
  status: 'Open',
  notes: null,
};

/** The 10 records the design's mockup pins exact values for. */
const EXPLICIT: DispatchDetail[] = [
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_07',
    reference: '#BBB-D 0000-07',
    typeOfActivity: 'Panhandling',
    howReferred: 'New Referred Type For Testing',
    status: 'Closed',
    priority: 'Low',
    createdAt: seedAt(0, 7 * 60 + 34),
    address: '6215 Kamer Ct, Charlestown, IN 47111, USA',
    location: '6215 Kamer Ct, Charlestown, IN 47111, USA',
    initialOutcome: 'Resolved',
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_06',
    reference: '#BBB-D 0000-06',
    typeOfActivity: 'Above and Below and Below',
    howReferred: 'Stakeholder/User Contact',
    status: 'Closed',
    priority: 'Low',
    createdAt: seedAt(0, 4 * 60 + 29),
    address: 'Lahore, Virginia, United States',
    location: 'Lahore, Virginia, United States',
    sourceNotes: 'test',
    locationNotes: 'test',
    tagSelected: 'Unsheltered',
    assignedIndividual: 'Waqas Taz',
    timeDispatched: seedAt(0, 4 * 60 + 28),
    timeArrived: seedAt(0, 4 * 60 + 28),
    initialOutcome: 'Resolved',
    outcomeNotes: 'Resolved in Dispatch initial review',
    escalations: [ESCALATION_EMS],
    incidents: [INCIDENT_1],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_05',
    reference: '#BBB-D 0000-05',
    typeOfActivity: 'Fire Dept Activity',
    howReferred: 'Identified On Camera',
    status: 'Closed',
    priority: 'Low',
    createdAt: seedAt(0, 4 * 60 + 24),
    address: 'Junipero Serra Freeway, Belmont, California 94002, USA',
    location: 'Junipero Serra Freeway, Belmont, California 94002, USA',
    initialOutcome: 'Resolved',
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_04',
    reference: '#BBB-D 0000-04',
    typeOfActivity: 'Above and Below and Below',
    howReferred: 'New Referred Type For Testing',
    status: 'Escalated',
    priority: 'Low',
    createdAt: seedAt(0, 4 * 60 + 17),
    address: 'Lahore, Virginia, United States',
    location: 'Lahore, Virginia, United States',
    tagSelected: 'Unsheltered',
    assignedIndividual: 'Waqas Taz',
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_11',
    reference: '#BBB-D 0000-11',
    typeOfActivity: 'Welfare Check',
    howReferred: 'Cro Initiated',
    status: 'Open',
    priority: 'High',
    createdAt: seedAt(1, 21 * 60 + 12),
    address: '900 16th St Mall, Denver, CO 80202',
    location: '900 16th St Mall, Denver, CO 80202',
    sourceNotes: 'Caller reported a person in distress near the kiosk.',
    tagSelected: 'Unsheltered',
    assignedIndividual: 'Marcus Bell',
    timeDispatched: seedAt(1, 21 * 60 + 15),
    timeArrived: seedAt(1, 21 * 60 + 27),
    initialOutcome: 'Referred to Outreach',
    escalations: [ESCALATION_POLICE],
    incidents: [INCIDENT_2],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_08',
    reference: '#BBB-D 0000-08',
    typeOfActivity: 'Suspicious Activity',
    howReferred: 'Citizen App',
    status: 'Escalated',
    priority: 'Medium',
    createdAt: seedAt(1, 15 * 60 + 40),
    address: '1701 Wynkoop St, Denver, CO 80202',
    location: '1701 Wynkoop St, Denver, CO 80202',
    assignedIndividual: 'Sara Diaz',
    timeDispatched: seedAt(1, 15 * 60 + 46),
    escalations: [ESCALATION_FIRE],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_10',
    reference: '#BBB-D 0000-10',
    typeOfActivity: 'Medical Assist',
    howReferred: 'Supervisor/Management Initiated',
    status: 'Closed',
    priority: 'High',
    createdAt: seedAt(1, 11 * 60 + 20),
    address: 'Civic Center Park, Denver, CO 80204',
    location: 'Civic Center Park, Denver, CO 80204',
    assignedIndividual: 'Ava Nguyen',
    timeDispatched: seedAt(1, 11 * 60 + 24),
    timeArrived: seedAt(1, 11 * 60 + 36),
    timeCleared: seedAt(1, 12 * 60 + 2),
    initialOutcome: 'Resolved',
    fullSquadResponse: 'Yes',
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_14',
    reference: '#BBB-D 0000-14',
    typeOfActivity: 'Noise Complaint',
    howReferred: 'Webform',
    status: 'Closed',
    priority: 'Low',
    createdAt: seedAt(2, 18 * 60 + 55),
    address: '1430 Larimer St, Denver, CO 80202',
    location: '1430 Larimer St, Denver, CO 80202',
    initialOutcome: 'Resolved',
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_09',
    reference: '#BBB-D 0000-09',
    typeOfActivity: 'Trespassing',
    howReferred: 'Stakeholder/User Contact',
    status: 'Open',
    priority: 'Medium',
    createdAt: seedAt(2, 13 * 60 + 5),
    address: '1601 Wewatta St, Denver, CO 80202',
    location: '1601 Wewatta St, Denver, CO 80202',
    assignedIndividual: 'Marcus Bell',
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_03',
    reference: '#BBB-D 0000-03',
    typeOfActivity: 'Graffiti Report',
    howReferred: 'Identified On Camera',
    status: 'Closed',
    priority: 'Low',
    createdAt: seedAt(2, 8 * 60 + 30),
    address: '16th & Curtis St, Denver, CO 80202',
    location: '16th & Curtis St, Denver, CO 80202',
    initialOutcome: 'Documented',
  },
];

const GEN_TYPES = [
  'Welfare Check',
  'Suspicious Activity',
  'Trespassing',
  'Panhandling',
  'Medical Assist',
  'Noise Complaint',
  'Graffiti Report',
];

const GEN_REFERRALS = [
  'Cro Initiated',
  'Supervisor/Management Initiated',
  'Stakeholder/User Contact',
  'Identified On Camera',
  'Citizen App',
  'Webform',
];

const GEN_STATUSES: DispatchStatus[] = ['Open', 'Escalated', 'Closed'];
const GEN_PRIORITIES: DispatchPriority[] = ['Low', 'Medium', 'High'];

const GEN_ADDRESSES = [
  '16th St Mall, Denver, CO 80202',
  '1601 Wewatta St, Denver, CO 80202',
  '1701 Wynkoop St, Denver, CO 80202',
  '1430 Larimer St, Denver, CO 80202',
  'Civic Center Park, Denver, CO 80204',
  '2001 Blake St, Denver, CO 80205',
];

const GEN_ASSIGNEES = ['Marcus Bell', 'Sara Diaz', 'Ava Nguyen', 'Waqas Taz'];

/**
 * Reference numbers count up from 0000-15, clear of every explicit reference
 * above (the highest of those is 0000-14), so nothing collides. 21 of them
 * brings the module total to 31 — the count the mockup shows.
 */
const GENERATED: DispatchDetail[] = Array.from({length: 21}, (_, i) => {
  const suffix = `0000-${pad(15 + i)}`;
  const status = GEN_STATUSES[i % GEN_STATUSES.length];
  const address = GEN_ADDRESSES[i % GEN_ADDRESSES.length];
  return {
    ...DETAIL_DEFAULTS,
    id: `dp_${suffix.replace('-', '_')}`,
    reference: `#BBB-D ${suffix}`,
    typeOfActivity: GEN_TYPES[i % GEN_TYPES.length],
    howReferred: GEN_REFERRALS[i % GEN_REFERRALS.length],
    status,
    priority: GEN_PRIORITIES[i % GEN_PRIORITIES.length],
    createdAt: toLocalIso(new Date(GEN_BASE - i * 7 * HOUR)),
    address,
    location: address,
    assignedIndividual: GEN_ASSIGNEES[i % GEN_ASSIGNEES.length],
    initialOutcome: status === 'Closed' ? 'Resolved' : null,
  };
});

export const MOCK_DISPATCHES: DispatchDetail[] = [...EXPLICIT, ...GENERATED];

/** Every list the Add Incident form offers, verbatim from the design's IncForm. */
export const MOCK_DISPATCH_INCIDENT_OPTIONS: Omit<
  DispatchIncidentFormOptions,
  'nextReference'
> = {
  incidentTypes: [
    'Vandalism',
    'Medical Emergency',
    'Theft',
    'Suspicious Activity',
    'Trespassing',
    'Property Damage',
    'Drug Activity',
    'Disturbance',
    'Graffiti',
    'Assault',
    'Lost Property',
    'Fire Hazard',
    'Panhandling',
  ],
  outcomes: [
    'Police Notified',
    'Police Called',
    'EMS Called',
    'EMS & Police',
    'Report Filed',
    'Warning Issued',
    'Reported',
    'Monitored',
    'Resolved',
    'Documented',
    'Returned to Owner',
    'Fire Dept Notified',
    'Referred to Outreach',
  ],
  zones: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'],
  businessNames: [
    '16th St Mall',
    'Union Station',
    'Larimer Square',
    'Civic Center',
    'LoDo District',
    'BlockByBlock',
  ],
  fixtures: [
    'Bench #B-204',
    'Trash Bin #T-88',
    'Planter #P-12',
    'Bike Rack #BR-5',
    'Light Pole #LP-19',
  ],
  partyTypes: ['Witness', 'Victim', 'Suspect', 'Bystander', 'Reporting Party', 'Other'],
  maintenanceOptions: [
    'Maintenance #96211407',
    'Maintenance #96211',
    'Maintenance #42984',
    'Maintenance #42931',
  ],
  poiOptions: ['POI #96211407', 'POI #96211', 'R. Blake', 'M. Ortiz', 'D. Cole'],
  equipmentOptions: [
    'Equipment #96211407',
    'Equipment #96211',
    'Tool Box',
    'Pressure Washer',
  ],
};
