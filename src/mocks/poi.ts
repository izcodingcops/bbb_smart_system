import {
  PoiContact,
  PoiDisposition,
  PoiInteraction,
  PoiRecord,
  PoiUpdate,
} from '../types/poi';

/* ---------------------------------------------------------------------------
 * Option lists — verbatim from the Ambassador POI export's create builder.
 * `ZONES` is not redeclared here; it already lives in
 * src/graphql/features/shared/options.ts and the resolver imports it there.
 * ------------------------------------------------------------------------ */

export const PERSON_TYPES = [
  'Unhoused Individual',
  'Repeat Trespasser',
  'Regular Visitor',
  'Outreach Contact',
  'Street Vendor',
  'Panhandler',
  'Business Owner',
  'Tourist',
  'Volunteer',
  'Other',
];

export const DISPOSITIONS: PoiDisposition[] = [
  'Active',
  'Deceased',
  'Housed',
  'In-active',
  'Incarcerated',
  'Transitional Care',
];

export const GENDERS = ['Male', 'Female', 'Unknown'];

export const RACES = [
  'White',
  'Black or African American',
  'Hispanic or Latino',
  'Asian',
  'American Indian or Alaska Native',
  'Native Hawaiian or Pacific Islander',
  'Two or More Races',
  'Unknown',
];

export const INTERACTION_TYPES = [
  'Verbal Warning',
  'Assistance Offered',
  'Wellness Check',
  'Resource Referral',
  'Trespass Notice',
  'Complaint',
  'Observation',
  'De-escalation',
  'Medical Aid Requested',
];

export const VIOLATIONS = [
  'Trespassing',
  'Loitering',
  'Aggressive Panhandling',
  'Vandalism',
  'Open Container',
  'Disturbance',
  'Other',
];

export const POI_FIXTURES = [
  'Bench #FX-1042',
  'Trash Receptacle #FX-2081',
  'Bike Rack #FX-3009',
  'Lamp Post #FX-4110',
  'Planter #FX-5033',
  'Bollard #FX-6021',
];

export const BUSINESS_LOCATIONS = [
  'Union Station Retail',
  'Larimer Square Shops',
  'LoDo Market',
  '16th St Mall Kiosk',
  'Civic Center Cafe',
  'Denver Rescue Mission',
];

export const INCIDENT_OPTIONS = [
  'Incident #IN-42984',
  'Incident #IN-42960',
  'Incident #IN-42931',
  'Incident #IN-42905',
];

export const MAINTENANCE_OPTIONS = [
  'Maintenance #96211407',
  'Maintenance #96211',
  'Maintenance #42984',
];

export const EQUIPMENT_OPTIONS = [
  'Equipment #96211407',
  'Equipment #96211',
  'Body Camera',
  'Radio',
];

/* ---------------------------------------------------------------------------
 * Dates
 *
 * The export's literals are 01–06 Feb 2026, which were already months stale by
 * the time this shipped. Every seeded date is an offset from a `SEED_NOW`
 * captured once at module load instead, chosen so each Date Range bucket is
 * non-empty and distinguishable: two records in Today, two in Yesterday, two
 * inside Last 7 days but not yesterday, four inside Last 30 but outside Last 7,
 * and one outside 30 days so the filter is visibly excluding something.
 * ------------------------------------------------------------------------ */

const SEED_NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const ago = (offset: number): string => new Date(SEED_NOW - offset).toISOString();

/**
 * Milliseconds elapsed since local midnight. The Today and Yesterday records
 * are placed relative to it rather than at a fixed number of hours back, so
 * they stay in their own bucket whatever time of day the app is launched — a
 * record seeded "6 hours ago" falls into Yesterday if you open the app at 5am.
 */
const SINCE_MIDNIGHT = (() => {
  const now = new Date(SEED_NOW);
  return (
    now.getHours() * HOUR + now.getMinutes() * 60000 + now.getSeconds() * 1000
  );
})();

/** `fraction` of the way back through today, from now to midnight. */
const todayAt = (fraction: number): string =>
  ago(Math.round(SINCE_MIDNIGHT * fraction));

/** `fraction` of the way back through yesterday, from its midnight. */
const yesterdayAt = (fraction: number): string =>
  ago(SINCE_MIDNIGHT + Math.round(DAY * fraction));

/** Fields every seeded person shares unless it overrides them. */
const DETAIL_DEFAULTS = {
  top1020: false,
  alias: null as string | null,
  gender: null as string | null,
  age: null as string | null,
  race: null as string | null,
  weight: null as string | null,
  height: null as string | null,
  physicalDescription: null as string | null,
  situation: null as string | null,
  describeLocation: null as string | null,
  contacts: [] as PoiContact[],
  connectedIncidents: [] as string[],
  connectedMaintenance: [] as string[],
  connectedEquipment: [] as string[],
};

/**
 * Filler history for the ten people the export's view builder doesn't detail.
 * The *count* is what matters — it's the export's own per-record number and the
 * card renders it — so the bodies rotate through the option lists rather than
 * inventing prose for fifty interactions. Reference blocks all sit below
 * #INT-9003 so James Rivera's verbatim timeline keeps the high-water mark and
 * the next generated reference is the export's own #INT-9007.
 */
function generateInteractions(
  key: string,
  count: number,
  zone: string,
  startRef: number,
): PoiInteraction[] {
  return Array.from({length: count}, (_, index) => ({
    id: `int_${key}_${index + 1}`,
    reference: `#INT-${startRef + index}`,
    interactionType: INTERACTION_TYPES[index % INTERACTION_TYPES.length],
    occurredAt: ago((index + 1) * 3 * DAY),
    zone,
    fixture: null,
    businessLocation: null,
    violation: index % 3 === 0 ? VIOLATIONS[index % VIOLATIONS.length] : null,
    note: 'Logged during routine patrol.',
    documents: [],
  }));
}

/** The update equivalent. Some people get none — the view's empty state has to
 * be reachable without editing code. */
function generateUpdates(
  key: string,
  count: number,
  zone: string,
  startRef: number,
): PoiUpdate[] {
  return Array.from({length: count}, (_, index) => ({
    id: `upd_${key}_${index + 1}`,
    reference: `#UPD-${startRef + index}`,
    occurredAt: ago((index + 2) * 4 * DAY),
    zone,
    description: 'Checked in during patrol — no change to report.',
  }));
}

/* ---------------------------------------------------------------------------
 * The 11 people, verbatim from the export's list builder.
 * Ids are opaque and deliberately unlike the references, so an id/reference
 * swap shows up at a glance instead of compiling silently.
 * ------------------------------------------------------------------------ */

export const MOCK_POIS: PoiRecord[] = [
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_rivera',
    reference: '#POI-4021',
    name: 'James Rivera',
    personType: 'Unhoused Individual',
    disposition: 'Active',
    zone: 'Zone 2',
    address: 'Union Station, 1701 Wynkoop St, Denver',
    createdBy: {name: 'John Carter', initials: 'JC'},
    queuedOffline: false,
    lastModifiedAt: todayAt(0.2),
    firstSeenAt: ago(62 * DAY),
    lastModifiedBy: 'John Carter',
    contact: '(303) 555-0142',
    // The one person the export details in full — every other seeded record
    // leans on DETAIL_DEFAULTS.
    top1020: true,
    alias: 'Jimmy R.',
    gender: 'Male',
    age: '52',
    race: 'White',
    weight: '180',
    height: '5\'11"',
    physicalDescription:
      'Grey jacket, approx. 6ft, often near the north plaza benches.',
    situation: 'Unhoused, sleeps near the transit plaza most nights.',
    describeLocation: 'Near the north entrance benches',
    contacts: [
      {
        name: 'Denver Rescue Mission',
        email: 'intake@denverrescue.org',
        phone: '(303) 555-0142',
        relationship: 'Case Worker',
        notes: 'Primary shelter contact.',
      },
      {
        name: 'Maria R.',
        email: '',
        phone: '(303) 555-0199',
        relationship: 'Sister',
        notes: '',
      },
    ],
    connectedIncidents: ['Incident #IN-42960', 'Incident #IN-42931'],
    connectedMaintenance: ['Maintenance #96211407'],
    connectedEquipment: ['Body Camera'],
    interactions: [
      {
        id: 'int_rivera_4',
        reference: '#INT-9006',
        interactionType: 'Wellness Check',
        occurredAt: todayAt(0.2),
        zone: 'Zone 2',
        fixture: null,
        businessLocation: null,
        violation: null,
        note: 'Checked in during morning rounds. Cooperative, accepted coffee and a resource card.',
        documents: [],
      },
      {
        id: 'int_rivera_3',
        reference: '#INT-9005',
        interactionType: 'Resource Referral',
        occurredAt: ago(4 * DAY),
        zone: 'Zone 2',
        fixture: null,
        businessLocation: null,
        violation: null,
        note: 'Referred to Denver Rescue Mission for overnight shelter. Provided directions.',
        documents: [],
      },
      {
        id: 'int_rivera_2',
        reference: '#INT-9004',
        interactionType: 'Verbal Warning',
        occurredAt: ago(9 * DAY),
        zone: 'Zone 2',
        fixture: null,
        businessLocation: null,
        violation: 'Loitering',
        note: 'Asked to move belongings from the main walkway. Complied without issue.',
        documents: [],
      },
      {
        id: 'int_rivera_1',
        reference: '#INT-9003',
        interactionType: 'Assistance Offered',
        occurredAt: ago(25 * DAY),
        zone: 'Zone 2',
        fixture: null,
        businessLocation: null,
        violation: null,
        note: 'First logged contact. Offered water and outreach information.',
        documents: [],
      },
    ],
    updates: [
      {
        id: 'upd_rivera_2',
        reference: '#UPD-3300',
        occurredAt: yesterdayAt(0.4),
        zone: 'Zone 2',
        description:
          'Evening patrol — individual remains near the transit plaza. No new concerns observed.',
      },
      {
        id: 'upd_rivera_1',
        reference: '#UPD-3299',
        occurredAt: ago(8 * DAY),
        zone: 'Zone 2',
        description:
          'Followed up after the verbal warning; situation stable, no further incidents this week.',
      },
    ],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_ellison',
    reference: '#POI-4018',
    name: 'Marcus Ellison',
    personType: 'Repeat Trespasser',
    disposition: 'Incarcerated',
    zone: 'Zone 4',
    address: '16th St Mall, 900 16th St, Denver',
    createdBy: {name: 'John Carter', initials: 'JC'},
    queuedOffline: false,
    lastModifiedAt: todayAt(0.75),
    firstSeenAt: ago(96 * DAY),
    lastModifiedBy: 'John Carter',
    contact: '(303) 555-0188',
    interactions: generateInteractions('ellison', 12, 'Zone 4', 8001),
    updates: generateUpdates('ellison', 2, 'Zone 4', 3201),
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_whitfield',
    reference: '#POI-4009',
    name: 'Dana Whitfield',
    personType: 'Regular Visitor',
    disposition: 'Housed',
    zone: 'Zone 1',
    address: 'Larimer Square, 1430 Larimer St, Denver',
    createdBy: {name: 'Sara Diaz', initials: 'SD'},
    queuedOffline: false,
    lastModifiedAt: yesterdayAt(0.3),
    firstSeenAt: ago(71 * DAY),
    lastModifiedBy: 'Sara Diaz',
    contact: 'd.whitfield@email.com',
    interactions: generateInteractions('whitfield', 3, 'Zone 1', 8101),
    updates: generateUpdates('whitfield', 1, 'Zone 1', 3211),
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_cole',
    reference: '#POI-3998',
    name: 'Theresa Cole',
    personType: 'Outreach Contact',
    disposition: 'Transitional Care',
    zone: 'Zone 3',
    address: 'Civic Center Park, Denver, CO 80202',
    createdBy: {name: 'John Carter', initials: 'JC'},
    // The export's one `sync: 'queued'` record, kept so the "Queued · offline"
    // badge and the still-uploading guard are both reachable from a cold start.
    queuedOffline: true,
    lastModifiedAt: yesterdayAt(0.75),
    firstSeenAt: ago(58 * DAY),
    lastModifiedBy: 'John Carter',
    contact: '(303) 555-0110',
    interactions: generateInteractions('cole', 5, 'Zone 3', 8201),
    updates: [],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_blake',
    reference: '#POI-3987',
    name: 'Robert Blake',
    personType: 'Unhoused Individual',
    disposition: 'In-active',
    zone: 'Zone 4',
    address: '16th & Curtis St, Denver, CO 80202',
    createdBy: {name: 'Marcus Bell', initials: 'MB'},
    queuedOffline: false,
    lastModifiedAt: ago(3 * DAY),
    firstSeenAt: ago(120 * DAY),
    lastModifiedBy: 'Marcus Bell',
    contact: '(303) 555-0164',
    interactions: generateInteractions('blake', 9, 'Zone 4', 8301),
    updates: generateUpdates('blake', 2, 'Zone 4', 3221),
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_hassan',
    reference: '#POI-3975',
    name: 'Nadia Hassan',
    personType: 'Street Vendor',
    disposition: 'Active',
    zone: 'Zone 5',
    address: 'LoDo District, 1601 Wewatta St, Denver',
    createdBy: {name: 'Ava Nguyen', initials: 'AN'},
    queuedOffline: false,
    lastModifiedAt: ago(5 * DAY),
    firstSeenAt: ago(44 * DAY),
    lastModifiedBy: 'Ava Nguyen',
    contact: 'n.hassan@email.com',
    interactions: generateInteractions('hassan', 2, 'Zone 5', 8401),
    updates: [],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_fisher',
    reference: '#POI-3960',
    name: 'Gregory Fisher',
    personType: 'Panhandler',
    disposition: 'Deceased',
    zone: 'Zone 3',
    address: 'Civic Center Park, Denver, CO 80202',
    createdBy: {name: 'John Carter', initials: 'JC'},
    queuedOffline: false,
    lastModifiedAt: ago(9 * DAY),
    firstSeenAt: ago(150 * DAY),
    lastModifiedBy: 'John Carter',
    contact: null,
    interactions: generateInteractions('fisher', 4, 'Zone 3', 8501),
    updates: generateUpdates('fisher', 1, 'Zone 3', 3231),
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_ortiz',
    reference: '#POI-3944',
    name: 'Michelle Ortiz',
    personType: 'Regular Visitor',
    disposition: 'Housed',
    zone: 'Zone 2',
    address: 'Union Station, 1701 Wynkoop St, Denver',
    createdBy: {name: 'Sara Diaz', initials: 'SD'},
    queuedOffline: false,
    lastModifiedAt: ago(14 * DAY),
    firstSeenAt: ago(38 * DAY),
    lastModifiedBy: 'Sara Diaz',
    contact: '(303) 555-0137',
    interactions: generateInteractions('ortiz', 1, 'Zone 2', 8601),
    updates: [],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_cross',
    reference: '#POI-3921',
    name: 'Daniel Cross',
    personType: 'Repeat Trespasser',
    disposition: 'Incarcerated',
    zone: 'Zone 1',
    address: 'Larimer Square, 1430 Larimer St, Denver',
    createdBy: {name: 'John Carter', initials: 'JC'},
    queuedOffline: false,
    lastModifiedAt: ago(21 * DAY),
    firstSeenAt: ago(140 * DAY),
    lastModifiedBy: 'John Carter',
    contact: '(303) 555-0175',
    interactions: generateInteractions('cross', 8, 'Zone 1', 8701),
    updates: generateUpdates('cross', 1, 'Zone 1', 3241),
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_moore',
    reference: '#POI-3908',
    name: 'Alicia Moore',
    personType: 'Outreach Contact',
    disposition: 'Transitional Care',
    zone: 'Zone 3',
    address: 'Civic Center Park, Denver, CO 80202',
    createdBy: {name: 'Ava Nguyen', initials: 'AN'},
    queuedOffline: false,
    lastModifiedAt: ago(28 * DAY),
    firstSeenAt: ago(88 * DAY),
    lastModifiedBy: 'Ava Nguyen',
    contact: '(303) 555-0121',
    interactions: generateInteractions('moore', 6, 'Zone 3', 8801),
    updates: [],
  },
  {
    ...DETAIL_DEFAULTS,
    id: 'poi_nguyen',
    reference: '#POI-3890',
    name: 'Victor Nguyen',
    personType: 'Business Owner',
    disposition: 'Active',
    zone: 'Zone 5',
    address: 'LoDo District, 1601 Wewatta St, Denver',
    createdBy: {name: 'Marcus Bell', initials: 'MB'},
    queuedOffline: false,
    // The one record outside 30 days, so the Date Range filter is visibly
    // excluding something rather than always matching everything.
    lastModifiedAt: ago(45 * DAY),
    firstSeenAt: ago(200 * DAY),
    lastModifiedBy: 'Marcus Bell',
    contact: 'v.nguyen@email.com',
    interactions: generateInteractions('nguyen', 2, 'Zone 5', 8901),
    updates: generateUpdates('nguyen', 1, 'Zone 5', 3251),
  },
];
