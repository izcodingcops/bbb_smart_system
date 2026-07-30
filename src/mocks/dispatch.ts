import {
  DispatchDetail,
  DispatchEscalation,
  DispatchIncident,
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

/** The mockup's single fully-populated incident, on dispatch #BBB-D 0000-06. */
const INCIDENT_1: DispatchIncident = {
  id: '1496371',
  label: 'Incident 1',
  createdBy: 'test user 99',
  priority: 'High',
  incidentType: 'Narcan',
  occurredAt: '2026-07-10T07:49:00',
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
  lastModifiedAt: '2026-07-10T07:49:00',
  police: {
    name: 'Jack Son',
    responder: null,
    timeCalled: '2026-07-10T07:40:00',
    timeArrived: '2026-07-10T07:45:00',
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

/** The mockup's single escalation, on the same dispatch. */
const ESCALATION_EMS: DispatchEscalation = {
  id: 'esc_0000_06_1',
  label: 'EMS',
  type: 'EMS',
  respondingPerson: 'test',
  timeCalled: '2026-07-02T04:18:00',
  timeArrived: '2026-07-02T04:18:00',
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
  timeCalled: '2026-07-01T21:20:00',
  timeArrived: '2026-07-01T21:31:00',
  timeCleared: '2026-07-01T22:05:00',
  status: 'Open',
  notes: 'Subject transported for evaluation.',
};

const ESCALATION_FIRE: DispatchEscalation = {
  id: 'esc_0000_08_1',
  label: 'Fire',
  type: 'Fire',
  respondingPerson: 'Engine 12',
  timeCalled: '2026-07-01T15:52:00',
  timeArrived: '2026-07-01T16:04:00',
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
    createdAt: '2026-07-02T07:34:00',
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
    createdAt: '2026-07-02T04:29:00',
    address: 'Lahore, Virginia, United States',
    location: 'Lahore, Virginia, United States',
    sourceNotes: 'test',
    locationNotes: 'test',
    tagSelected: 'Unsheltered',
    assignedIndividual: 'Waqas Taz',
    timeDispatched: '2026-07-02T04:28:00',
    timeArrived: '2026-07-02T04:28:00',
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
    createdAt: '2026-07-02T04:24:00',
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
    createdAt: '2026-07-02T04:17:00',
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
    createdAt: '2026-07-01T21:12:00',
    address: '900 16th St Mall, Denver, CO 80202',
    location: '900 16th St Mall, Denver, CO 80202',
    sourceNotes: 'Caller reported a person in distress near the kiosk.',
    tagSelected: 'Unsheltered',
    assignedIndividual: 'Marcus Bell',
    timeDispatched: '2026-07-01T21:15:00',
    timeArrived: '2026-07-01T21:27:00',
    initialOutcome: 'Referred to Outreach',
    escalations: [ESCALATION_POLICE],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'dp_0000_08',
    reference: '#BBB-D 0000-08',
    typeOfActivity: 'Suspicious Activity',
    howReferred: 'Citizen App',
    status: 'Escalated',
    priority: 'Medium',
    createdAt: '2026-07-01T15:40:00',
    address: '1701 Wynkoop St, Denver, CO 80202',
    location: '1701 Wynkoop St, Denver, CO 80202',
    assignedIndividual: 'Sara Diaz',
    timeDispatched: '2026-07-01T15:46:00',
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
    createdAt: '2026-07-01T11:20:00',
    address: 'Civic Center Park, Denver, CO 80204',
    location: 'Civic Center Park, Denver, CO 80204',
    assignedIndividual: 'Ava Nguyen',
    timeDispatched: '2026-07-01T11:24:00',
    timeArrived: '2026-07-01T11:36:00',
    timeCleared: '2026-07-01T12:02:00',
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
    createdAt: '2026-06-30T18:55:00',
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
    createdAt: '2026-06-30T13:05:00',
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
    createdAt: '2026-06-30T08:30:00',
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
/** Just under the oldest explicit record, so generated rows sort below them. */
const GEN_BASE = new Date('2026-06-30T06:00:00').getTime();

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
