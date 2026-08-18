import {AmbassadorRecord, AmbassadorWork} from '../types/ambassador';

/* ------------------------------------------------------------------ *
 * Ambassadors
 * ------------------------------------------------------------------ */

const EXPLICIT_AMBASSADORS: AmbassadorRecord[] = [
  {id: 'amb_27617', reference: '#27617', name: 'Arslan Saeed', username: 'arslansaeed', jobTitle: 'Ambassador', status: 'Active', points: 1240, cases: 3, rating: 4.6, lastLoggedIn: '2026-06-16T10:36:00', badges: ['100 Shifts', 'Zero Incidents', 'Top Cleaner']},
  {id: 'amb_27612', reference: '#27612', name: 'Waqas Ahmed', username: '0000waqas', jobTitle: 'Ambassador', status: 'Active', points: 0, cases: 0, rating: 0, lastLoggedIn: '2026-07-23T05:31:00', badges: []},
  {id: 'amb_27608', reference: '#27608', name: 'Asim Muhammad', username: '0000asimt', jobTitle: 'Administrative Assistant', status: 'Active', points: 860, cases: 12, rating: 4.2, lastLoggedIn: '2026-07-01T11:27:00', badges: ['Safety Star', 'Perfect Uniform']},
  {id: 'amb_27605', reference: '#27605', name: 'Robin Hood', username: 'rhood', jobTitle: 'Custom Title', status: 'In-active', points: 310, cases: 5, rating: 3.4, lastLoggedIn: '2026-06-18T11:00:00', badges: ['Public Favorite']},
  {id: 'amb_27598', reference: '#27598', name: 'Teeya Barnes', username: 'tbarnes', jobTitle: 'Team Lead', status: 'Active', points: 2180, cases: 41, rating: 4.9, lastLoggedIn: '2026-07-24T07:12:00', badges: ['500 Shifts', 'Zero Incidents', 'Mentor', 'Top Cleaner']},
  {id: 'amb_27591', reference: '#27591', name: 'Kelson Palmer', username: '6560kpalmer', jobTitle: 'Supervisor', status: 'Active', points: 1975, cases: 33, rating: 4.7, lastLoggedIn: '2026-07-22T06:39:00', badges: ['Mentor', 'Safety Star']},
  {id: 'amb_27584', reference: '#27584', name: 'Chad Williamson', username: 'cwilliamson', jobTitle: 'Ambassador', status: 'Suspended', points: 420, cases: 9, rating: 2.8, lastLoggedIn: '2026-06-20T06:36:00', badges: []},
  {id: 'amb_27577', reference: '#27577', name: 'Ava Nguyen', username: 'anguyen', jobTitle: 'Ambassador', status: 'Active', points: 1510, cases: 27, rating: 4.5, lastLoggedIn: '2026-07-21T08:02:00', badges: ['250 Shifts', 'Public Favorite']},
  {id: 'amb_27569', reference: '#27569', name: 'Marcus Bell', username: 'mbell', jobTitle: 'Ambassador', status: 'Active', points: 735, cases: 16, rating: 3.9, lastLoggedIn: '2026-07-15T14:11:00', badges: ['Perfect Uniform']},
  {id: 'amb_27561', reference: '#27561', name: 'Sara Diaz', username: 'sdiaz', jobTitle: 'Hospitality Ambassador', status: 'In-active', points: 95, cases: 2, rating: 3.1, lastLoggedIn: '2026-05-28T09:44:00', badges: []},
];

const GEN_NAMES = [
  'Devon Reyes', 'Priya Anand', 'Malik Freeman', 'Lena Osei', 'Jordan Blake',
  'Grace Kim', 'Owen Castillo', 'Nadia Farouk', 'Ethan Brooks', 'Ines Moreau',
  'Tariq Salim', 'Bianca Ferreira', 'Miles Ashton', 'Corinne Vance', 'Ravi Chandra',
];
const GEN_TITLES = ['Ambassador', 'Ambassador', 'Ambassador', 'Team Lead', 'Hospitality Ambassador'];
const GEN_STATUSES: AmbassadorRecord['status'][] = ['Active', 'Active', 'Active', 'In-active', 'Suspended'];
const GEN_BADGE_SETS = [
  [],
  ['Perfect Uniform'],
  ['100 Shifts'],
  ['Safety Star', 'Public Favorite'],
  ['Zero Incidents'],
];

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_NOW = Date.now();

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date(SEED_NOW - daysAgo * DAY_MS);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}:00`;
}

/** Spreads across the last five weeks so "Last Active Date" isn't a wall of one day. */
const GEN_DAYS_AGO = [0, 1, 2, 3, 5, 7, 9, 11, 14, 17, 20, 23, 27, 31, 35];

function generateAmbassadors(): AmbassadorRecord[] {
  return GEN_NAMES.map((name, i) => {
    const num = 27553 - i * 4;
    return {
      id: `amb_gen_${num}`,
      reference: `#${num}`,
      name,
      username: name.toLowerCase().replace(/\s+/g, ''),
      jobTitle: GEN_TITLES[i % GEN_TITLES.length],
      status: GEN_STATUSES[i % GEN_STATUSES.length],
      points: (i * 137) % 2200,
      cases: (i * 3) % 30,
      rating: GEN_STATUSES[i % GEN_STATUSES.length] === 'Suspended' ? 2 + (i % 3) * 0.4 : 3.2 + (i % 5) * 0.35,
      lastLoggedIn: isoAt(GEN_DAYS_AGO[i], 6 + (i % 10), (i * 17) % 60),
      badges: GEN_BADGE_SETS[i % GEN_BADGE_SETS.length],
    };
  });
}

// Lowest explicit id is #27561 — the generated ids start below it so
// generated and explicit ids never collide.
export const MOCK_AMBASSADORS: AmbassadorRecord[] = [
  ...EXPLICIT_AMBASSADORS,
  ...generateAmbassadors(),
];

/* ------------------------------------------------------------------ *
 * Ambassador work (Cleaning + Maintenance)
 * ------------------------------------------------------------------ */

const EXPLICIT_WORK: AmbassadorWork[] = [
  {id: 'ambwork_107799672', reference: '#107799672', ambassadorId: 'amb_27617', type: 'Cleaning', subType: 'Elevator Check', status: 'In Progress', points: 0, date: '2026-07-09T07:19:00', businessName: 'Union Station', quantity: '01', zone: 'Downtown Core', describeLocation: 'North entrance, beside ticket vending machine', fixtureType: 'Access Fixture', fixture: 'Elevator E-2', service: 'Inspect', address: '1701 Wynkoop St, Denver, CO 80202'},
  {id: 'ambwork_107398227', reference: '#107398227', ambassadorId: 'amb_27617', type: 'Cleaning', subType: 'Graffiti Removal', status: 'In Progress', points: 0, date: '2026-06-22T05:55:00', businessName: 'Larimer Square', quantity: '02', zone: 'Downtown Core', describeLocation: 'North facade, near the loading dock', fixtureType: 'Art Fixture', fixture: 'Wall Panel B', service: 'Clean', address: '1430 Larimer St, Denver, CO 80202'},
  {id: 'ambwork_107398189', reference: '#107398189', ambassadorId: 'amb_27617', type: 'Cleaning', subType: 'Litter Pickup', status: 'Completed', points: 35, date: '2026-06-16T03:15:00', businessName: '', quantity: '01', zone: 'Transit Hub', describeLocation: 'Along the 1400 block sidewalk', fixtureType: null, fixture: null, service: 'Clean', address: '16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107397333', reference: '#107397333', ambassadorId: 'amb_27617', type: 'Maintenance', subType: 'Bench Repair', status: 'Completed', points: 60, date: '2026-06-12T10:40:00', businessName: 'Riverfront Plaza', quantity: '02', zone: 'Riverfront', describeLocation: 'Two slats loose on the promenade bench', fixtureType: 'Site Furniture', fixture: 'Bench B-14', service: 'Repair', address: '1601 Wewatta St, Denver, CO 80202'},
  {id: 'ambwork_107397166', reference: '#107397166', ambassadorId: 'amb_27617', type: 'Cleaning', subType: 'Pressure Washing', status: 'Completed', points: 50, date: '2026-06-09T10:37:00', businessName: 'Civic Center Park', quantity: '01', zone: 'Civic Center', describeLocation: 'Fountain plaza, west side', fixtureType: 'Hardscape', fixture: 'Plaza Deck', service: 'Wash', address: '101 W 14th Ave Pkwy, Denver, CO 80204'},
  {id: 'ambwork_107396933', reference: '#107396933', ambassadorId: 'amb_27617', type: 'Maintenance', subType: 'Light Out', status: 'Open', points: 0, date: '2026-06-04T10:32:00', businessName: 'Denver Pavilions', quantity: '01', zone: 'Market District', describeLocation: 'Second lamp post from the west stair', fixtureType: 'Lighting', fixture: 'Lamp L-08', service: 'Replace', address: '500 16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107396728', reference: '#107396728', ambassadorId: 'amb_27617', type: 'Cleaning', subType: 'Trash Bin Empty', status: 'Completed', points: 25, date: '2026-05-30T10:27:00', businessName: 'Union Station', quantity: '08', zone: 'Transit Hub', describeLocation: 'All platform-level bins', fixtureType: 'Waste Fixture', fixture: 'Bin Row P', service: 'Clean', address: '1701 Wynkoop St, Denver, CO 80202'},
  {id: 'ambwork_107396504', reference: '#107396504', ambassadorId: 'amb_27617', type: 'Cleaning', subType: 'Gum Removal', status: 'Completed', points: 30, date: '2026-05-24T09:18:00', businessName: '16th Street Mall', quantity: '06', zone: 'Transit Hub', describeLocation: 'Bus shelter pads, north stretch', fixtureType: 'Hardscape', fixture: 'Shelter Pad 3', service: 'Clean', address: '16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107395880', reference: '#107395880', ambassadorId: 'amb_27612', type: 'Cleaning', subType: 'Sidewalk Sweep', status: 'Completed', points: 20, date: '2026-07-22T08:05:00', businessName: 'Larimer Square', quantity: '03', zone: 'Downtown Core', describeLocation: 'Between Curtis St and Champa St', fixtureType: null, fixture: null, service: 'Clean', address: '1430 Larimer St, Denver, CO 80202'},
  {id: 'ambwork_107399415', reference: '#107399415', ambassadorId: 'amb_27598', type: 'Cleaning', subType: 'Litter Pickup', status: 'In Progress', points: 0, date: '2026-07-24T06:58:00', businessName: '16th Street Mall', quantity: '04', zone: 'Transit Hub', describeLocation: 'Between Curtis St and Champa St', fixtureType: null, fixture: null, service: 'Clean', address: '16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107399288', reference: '#107399288', ambassadorId: 'amb_27598', type: 'Maintenance', subType: 'Bench Repair', status: 'Completed', points: 60, date: '2026-07-21T09:14:00', businessName: 'Riverfront Plaza', quantity: '01', zone: 'Riverfront', describeLocation: 'Armrest bolt sheared on bench near the stair', fixtureType: 'Site Furniture', fixture: 'Bench B-07', service: 'Repair', address: '1601 Wewatta St, Denver, CO 80202'},
  {id: 'ambwork_107399104', reference: '#107399104', ambassadorId: 'amb_27598', type: 'Cleaning', subType: 'Graffiti Removal', status: 'Completed', points: 45, date: '2026-07-17T07:36:00', businessName: 'Denver Pavilions', quantity: '02', zone: 'Market District', describeLocation: 'Service corridor door, west side', fixtureType: 'Art Fixture', fixture: 'Door D-3', service: 'Clean', address: '500 16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107398902', reference: '#107398902', ambassadorId: 'amb_27598', type: 'Cleaning', subType: 'Pressure Washing', status: 'Completed', points: 50, date: '2026-07-12T10:02:00', businessName: 'Civic Center Park', quantity: '01', zone: 'Civic Center', describeLocation: 'Amphitheater steps and landing', fixtureType: 'Hardscape', fixture: 'Step Landing', service: 'Wash', address: '101 W 14th Ave Pkwy, Denver, CO 80204'},
  {id: 'ambwork_107399377', reference: '#107399377', ambassadorId: 'amb_27591', type: 'Maintenance', subType: 'Light Out', status: 'In Progress', points: 0, date: '2026-07-22T06:21:00', businessName: 'Union Station', quantity: '02', zone: 'Transit Hub', describeLocation: 'Two platform lamps out at the west end', fixtureType: 'Lighting', fixture: 'Lamp L-12', service: 'Replace', address: '1701 Wynkoop St, Denver, CO 80202'},
  {id: 'ambwork_107399190', reference: '#107399190', ambassadorId: 'amb_27591', type: 'Cleaning', subType: 'Elevator Check', status: 'Completed', points: 30, date: '2026-07-18T08:47:00', businessName: 'Union Station', quantity: '01', zone: 'Transit Hub', describeLocation: 'North entrance, beside ticket vending machine', fixtureType: 'Access Fixture', fixture: 'Elevator E-1', service: 'Inspect', address: '1701 Wynkoop St, Denver, CO 80202'},
  {id: 'ambwork_107398841', reference: '#107398841', ambassadorId: 'amb_27591', type: 'Cleaning', subType: 'Trash Bin Empty', status: 'Completed', points: 25, date: '2026-07-11T07:05:00', businessName: 'Larimer Square', quantity: '06', zone: 'Downtown Core', describeLocation: 'All bins on the 1400 block', fixtureType: 'Waste Fixture', fixture: 'Bin Row L', service: 'Clean', address: '1430 Larimer St, Denver, CO 80202'},
  {id: 'ambwork_107399341', reference: '#107399341', ambassadorId: 'amb_27577', type: 'Cleaning', subType: 'Weed Removal', status: 'Open', points: 0, date: '2026-07-21T07:44:00', businessName: 'Riverfront Plaza', quantity: '03', zone: 'Riverfront', describeLocation: 'Planter beds along the promenade', fixtureType: 'Landscape', fixture: 'Planter L-7', service: 'Clean', address: '1601 Wewatta St, Denver, CO 80202'},
  {id: 'ambwork_107399052', reference: '#107399052', ambassadorId: 'amb_27577', type: 'Cleaning', subType: 'Gum Removal', status: 'Completed', points: 30, date: '2026-07-16T09:29:00', businessName: '16th Street Mall', quantity: '05', zone: 'Transit Hub', describeLocation: 'Bus shelter pads, south stretch', fixtureType: 'Hardscape', fixture: 'Shelter Pad 6', service: 'Clean', address: '16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107398733', reference: '#107398733', ambassadorId: 'amb_27577', type: 'Maintenance', subType: 'Signage Damage', status: 'Completed', points: 40, date: '2026-07-08T13:19:00', businessName: 'Denver Pavilions', quantity: '01', zone: 'Market District', describeLocation: 'Wayfinding panel cracked at the east stair', fixtureType: 'Signage', fixture: 'Panel W-4', service: 'Repair', address: '500 16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107398612', reference: '#107398612', ambassadorId: 'amb_27608', type: 'Cleaning', subType: 'Restroom Check', status: 'Completed', points: 20, date: '2026-06-30T11:12:00', businessName: 'Denver Pavilions', quantity: '01', zone: 'Market District', describeLocation: 'Level 2 public restroom', fixtureType: 'Access Fixture', fixture: 'Restroom R-2', service: 'Inspect', address: '500 16th St Mall, Denver, CO 80202'},
  {id: 'ambwork_107398455', reference: '#107398455', ambassadorId: 'amb_27608', type: 'Cleaning', subType: 'Planter Watering', status: 'Completed', points: 15, date: '2026-06-25T08:33:00', businessName: 'Larimer Square', quantity: '02', zone: 'Downtown Core', describeLocation: 'Hanging baskets on the arch', fixtureType: 'Landscape', fixture: 'Basket Set A', service: 'Maintain', address: '1430 Larimer St, Denver, CO 80202'},
  {id: 'ambwork_107398310', reference: '#107398310', ambassadorId: 'amb_27569', type: 'Cleaning', subType: 'Leaf Removal', status: 'Completed', points: 35, date: '2026-07-14T09:51:00', businessName: 'Beachmont Boardwalk', quantity: '07', zone: 'Beachmont', describeLocation: 'Boardwalk gutters, full length', fixtureType: null, fixture: null, service: 'Clean', address: '2000 Little Raven St, Denver, CO 80202'},
  {id: 'ambwork_107398201', reference: '#107398201', ambassadorId: 'amb_27569', type: 'Maintenance', subType: 'Bench Repair', status: 'In Progress', points: 0, date: '2026-07-10T12:26:00', businessName: 'Beachmont Boardwalk', quantity: '01', zone: 'Beachmont', describeLocation: 'Loose slat mid-boardwalk', fixtureType: 'Site Furniture', fixture: 'Bench B-21', service: 'Repair', address: '2000 Little Raven St, Denver, CO 80202'},
  {id: 'ambwork_107397988', reference: '#107397988', ambassadorId: 'amb_27605', type: 'Cleaning', subType: 'Spill Cleanup', status: 'Completed', points: 20, date: '2026-06-17T10:48:00', businessName: 'Civic Center Park', quantity: '01', zone: 'Civic Center', describeLocation: 'Near the amphitheater steps', fixtureType: 'Hardscape', fixture: 'Step Landing', service: 'Clean', address: '101 W 14th Ave Pkwy, Denver, CO 80204'},
  {id: 'ambwork_107397640', reference: '#107397640', ambassadorId: 'amb_27584', type: 'Cleaning', subType: 'Sidewalk Sweep', status: 'Completed', points: 20, date: '2026-06-19T06:12:00', businessName: 'Union Station', quantity: '02', zone: 'Transit Hub', describeLocation: 'Wynkoop St frontage', fixtureType: null, fixture: null, service: 'Clean', address: '1701 Wynkoop St, Denver, CO 80202'},
  {id: 'ambwork_107397102', reference: '#107397102', ambassadorId: 'amb_27561', type: 'Cleaning', subType: 'Litter Pickup', status: 'Completed', points: 15, date: '2026-05-27T09:03:00', businessName: 'Larimer Square', quantity: '02', zone: 'Downtown Core', describeLocation: 'Alley side, behind the arch', fixtureType: null, fixture: null, service: 'Clean', address: '1430 Larimer St, Denver, CO 80202'},
];

const GEN_SUBTYPES: {type: AmbassadorWork['type']; subType: string; service: string; fixtureType: string | null; fixture: string | null}[] = [
  {type: 'Cleaning', subType: 'Litter Pickup', service: 'Clean', fixtureType: null, fixture: null},
  {type: 'Cleaning', subType: 'Sidewalk Sweep', service: 'Clean', fixtureType: null, fixture: null},
  {type: 'Maintenance', subType: 'Bench Repair', service: 'Repair', fixtureType: 'Site Furniture', fixture: 'Bench B-30'},
  {type: 'Cleaning', subType: 'Graffiti Removal', service: 'Clean', fixtureType: 'Art Fixture', fixture: 'Wall Panel C'},
  {type: 'Maintenance', subType: 'Light Out', service: 'Replace', fixtureType: 'Lighting', fixture: 'Lamp L-20'},
];
const GEN_BUSINESSES = [
  {name: 'Union Station', zone: 'Transit Hub', address: '1701 Wynkoop St, Denver, CO 80202'},
  {name: 'Larimer Square', zone: 'Downtown Core', address: '1430 Larimer St, Denver, CO 80202'},
  {name: 'Civic Center Park', zone: 'Civic Center', address: '101 W 14th Ave Pkwy, Denver, CO 80204'},
  {name: 'Beachmont Boardwalk', zone: 'Beachmont', address: '2000 Little Raven St, Denver, CO 80202'},
];
const GEN_STATUSES_WORK: AmbassadorWork['status'][] = ['Completed', 'Completed', 'In Progress', 'Open'];
const GEN_WORK_DAYS_AGO = [1, 2, 4, 6, 9, 12, 15, 18, 21, 25];

function generateWork(): AmbassadorWork[] {
  const ambassadors = MOCK_AMBASSADORS;
  return GEN_WORK_DAYS_AGO.map((daysAgo, i) => {
    const amb = ambassadors[i % ambassadors.length];
    const spec = GEN_SUBTYPES[i % GEN_SUBTYPES.length];
    const biz = GEN_BUSINESSES[i % GEN_BUSINESSES.length];
    const status = GEN_STATUSES_WORK[i % GEN_STATUSES_WORK.length];
    const num = 107396400 - i * 5;
    return {
      id: `ambwork_gen_${num}`,
      reference: `#${num}`,
      ambassadorId: amb.id,
      type: spec.type,
      subType: spec.subType,
      status,
      points: status === 'Completed' ? 20 + (i % 4) * 10 : 0,
      date: isoAt(daysAgo, 7 + (i % 9), (i * 11) % 60),
      businessName: spec.type === 'Cleaning' ? biz.name : '',
      quantity: pad((i % 6) + 1),
      zone: biz.zone,
      describeLocation: `Routine ${spec.subType.toLowerCase()} pass`,
      fixtureType: spec.fixtureType,
      fixture: spec.fixture,
      service: spec.service,
      address: biz.address,
    };
  });
}

// Lowest explicit id is #107395880 — the generated floor sits below it so
// generated and explicit ids never collide.
export const MOCK_AMBASSADOR_WORK: AmbassadorWork[] = [
  ...EXPLICIT_WORK,
  ...generateWork(),
];
