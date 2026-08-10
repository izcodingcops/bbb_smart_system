import {ReferenceDocument} from '../types/referenceDocument';

const CREATED_BY = 'John Miller · Ambassador';

const EXPLICIT: ReferenceDocument[] = [
  {id: 'refdoc_107799687', reference: '#107799687', entryType: 'Elevator Check', business: 'Union Station', quantity: '01', zone: 'Downtown Core', dateTime: '2026-07-17T09:37:00', describe: 'North entrance, beside ticket vending machine', fixtureType: 'Access Fixture', fixture: 'Elevator E-2', service: 'Inspect', assignedTo: 'John Miller', createdBy: CREATED_BY, address: '1701 Wynkoop St, Denver, CO 80202'},
  {id: 'refdoc_107799686', reference: '#107799686', entryType: 'Litter Pickup', business: 'Larimer Square', quantity: '03', zone: 'Downtown Core', dateTime: '2026-07-17T06:40:00', describe: 'Along the 1400 block sidewalk', fixtureType: null, fixture: null, service: 'Clean', assignedTo: 'John Miller', createdBy: CREATED_BY, address: '1430 Larimer St, Denver, CO 80202'},
  {id: 'refdoc_107799682', reference: '#107799682', entryType: 'Graffiti Removal', business: 'Boutique', quantity: '02', zone: 'Beachmont', dateTime: '2026-07-14T09:52:00', describe: 'North facade, near loading dock', fixtureType: 'Art Fixture', fixture: 'Wall Panel B', service: 'Clean', assignedTo: 'John Miller', createdBy: CREATED_BY, address: '34 Ellis St, Denver, CO 80202'},
  {id: 'refdoc_107799680', reference: '#107799680', entryType: 'Sidewalk Sweep', business: '16th Street Mall', quantity: '05', zone: 'Transit Hub', dateTime: '2026-07-13T13:27:00', describe: 'Between Curtis St and Champa St', fixtureType: null, fixture: null, service: 'Clean', assignedTo: 'Marcus Bell', createdBy: CREATED_BY, address: '16th St Mall, Denver, CO 80202'},
  {id: 'refdoc_107799674', reference: '#107799674', entryType: 'Pressure Washing', business: 'Civic Center Park', quantity: '01', zone: 'Civic Center', dateTime: '2026-07-11T11:14:00', describe: 'Fountain plaza, west side', fixtureType: 'Hardscape', fixture: 'Plaza Deck', service: 'Wash', assignedTo: 'Sara Diaz', createdBy: CREATED_BY, address: '101 W 14th Ave Pkwy, Denver, CO 80204'},
  {id: 'refdoc_107799669', reference: '#107799669', entryType: 'Trash Bin Empty', business: 'Union Station', quantity: '08', zone: 'Transit Hub', dateTime: '2026-07-10T08:06:00', describe: 'All platform-level bins', fixtureType: 'Waste Fixture', fixture: 'Bin Row P', service: 'Clean', assignedTo: 'John Miller', createdBy: CREATED_BY, address: '1701 Wynkoop St, Denver, CO 80202'},
  {id: 'refdoc_107799661', reference: '#107799661', entryType: 'Weed Removal', business: 'Riverfront Plaza', quantity: '04', zone: 'Riverfront', dateTime: '2026-07-09T15:12:00', describe: 'Planter beds along the promenade', fixtureType: 'Landscape', fixture: 'Planter L-7', service: 'Clean', assignedTo: 'Ava Nguyen', createdBy: CREATED_BY, address: '1601 Wewatta St, Denver, CO 80202'},
  {id: 'refdoc_107799655', reference: '#107799655', entryType: 'Gum Removal', business: '16th Street Mall', quantity: '06', zone: 'Transit Hub', dateTime: '2026-07-08T10:45:00', describe: 'Bus shelter pads, north stretch', fixtureType: 'Hardscape', fixture: 'Shelter Pad 3', service: 'Clean', assignedTo: 'Marcus Bell', createdBy: CREATED_BY, address: '16th St Mall, Denver, CO 80202'},
  {id: 'refdoc_107799648', reference: '#107799648', entryType: 'Restroom Check', business: 'Denver Pavilions', quantity: '01', zone: 'Market District', dateTime: '2026-07-07T07:29:00', describe: 'Level 2 public restroom', fixtureType: 'Access Fixture', fixture: 'Restroom R-2', service: 'Inspect', assignedTo: 'John Miller', createdBy: CREATED_BY, address: '500 16th St Mall, Denver, CO 80202'},
  {id: 'refdoc_107799640', reference: '#107799640', entryType: 'Planter Watering', business: 'Larimer Square', quantity: '02', zone: 'Downtown Core', dateTime: '2026-07-05T14:03:00', describe: 'Hanging baskets on the arch', fixtureType: 'Landscape', fixture: 'Basket Set A', service: 'Maintain', assignedTo: 'Sara Diaz', createdBy: CREATED_BY, address: '1430 Larimer St, Denver, CO 80202'},
  {id: 'refdoc_107799633', reference: '#107799633', entryType: 'Leaf Removal', business: 'Beachmont Boardwalk', quantity: '07', zone: 'Beachmont', dateTime: '2026-07-03T09:18:00', describe: 'Boardwalk gutters, full length', fixtureType: null, fixture: null, service: 'Clean', assignedTo: 'Ava Nguyen', createdBy: CREATED_BY, address: '2000 Little Raven St, Denver, CO 80202'},
  {id: 'refdoc_107799625', reference: '#107799625', entryType: 'Spill Cleanup', business: 'Civic Center Park', quantity: '01', zone: 'Civic Center', dateTime: '2026-07-01T11:50:00', describe: 'Near the amphitheater steps', fixtureType: 'Hardscape', fixture: 'Step Landing', service: 'Clean', assignedTo: 'John Miller', createdBy: CREATED_BY, address: '101 W 14th Ave Pkwy, Denver, CO 80204'},
];

const BUSINESSES: {name: string; zone: string; address: string}[] = [
  {name: 'Union Station', zone: 'Transit Hub', address: '1701 Wynkoop St, Denver, CO 80202'},
  {name: 'Larimer Square', zone: 'Downtown Core', address: '1430 Larimer St, Denver, CO 80202'},
  {name: 'Boutique', zone: 'Beachmont', address: '34 Ellis St, Denver, CO 80202'},
  {name: '16th Street Mall', zone: 'Transit Hub', address: '16th St Mall, Denver, CO 80202'},
  {name: 'Civic Center Park', zone: 'Civic Center', address: '101 W 14th Ave Pkwy, Denver, CO 80204'},
  {name: 'Riverfront Plaza', zone: 'Riverfront', address: '1601 Wewatta St, Denver, CO 80202'},
  {name: 'Beachmont Boardwalk', zone: 'Beachmont', address: '2000 Little Raven St, Denver, CO 80202'},
  {name: 'Denver Pavilions', zone: 'Market District', address: '500 16th St Mall, Denver, CO 80202'},
];

const ENTRY_TYPES: {entry: string; service: string; fixtureType: string | null; fixture: string | null}[] = [
  {entry: 'Elevator Check', service: 'Inspect', fixtureType: 'Access Fixture', fixture: 'Elevator E-1'},
  {entry: 'Litter Pickup', service: 'Clean', fixtureType: null, fixture: null},
  {entry: 'Graffiti Removal', service: 'Clean', fixtureType: 'Art Fixture', fixture: 'Wall Panel A'},
  {entry: 'Sidewalk Sweep', service: 'Clean', fixtureType: null, fixture: null},
  {entry: 'Pressure Washing', service: 'Wash', fixtureType: 'Hardscape', fixture: 'Plaza Deck'},
  {entry: 'Trash Bin Empty', service: 'Clean', fixtureType: 'Waste Fixture', fixture: 'Bin Row A'},
  {entry: 'Weed Removal', service: 'Clean', fixtureType: 'Landscape', fixture: 'Planter A-1'},
  {entry: 'Gum Removal', service: 'Clean', fixtureType: 'Hardscape', fixture: 'Shelter Pad 1'},
  {entry: 'Restroom Check', service: 'Inspect', fixtureType: 'Access Fixture', fixture: 'Restroom R-1'},
  {entry: 'Planter Watering', service: 'Maintain', fixtureType: 'Landscape', fixture: 'Basket Set B'},
  {entry: 'Leaf Removal', service: 'Clean', fixtureType: null, fixture: null},
  {entry: 'Spill Cleanup', service: 'Clean', fixtureType: 'Hardscape', fixture: 'Step Landing'},
];

const ASSIGNEES = ['John Miller', 'Marcus Bell', 'Sara Diaz', 'Ava Nguyen', 'Devon Reyes', 'Priya Anand'];

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_NOW = Date.now();

/** Spreads across today, yesterday, last-7, last-30 and this-month so the
 * archive isn't a wall of July dates — Date Range doesn't filter, but the
 * list itself should still read as fresh. */
const DAYS_AGO = [0, 0, 1, 2, 4, 6, 8, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date(SEED_NOW - daysAgo * DAY_MS);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}:00`;
}

function generate(): ReferenceDocument[] {
  return DAYS_AGO.map((daysAgo, i) => {
    const biz = BUSINESSES[i % BUSINESSES.length];
    const entry = ENTRY_TYPES[i % ENTRY_TYPES.length];
    const num = 107799600 - i * 3;
    return {
      id: `refdoc_gen_${num}`,
      reference: `#${num}`,
      entryType: entry.entry,
      business: biz.name,
      quantity: pad((i % 8) + 1),
      zone: biz.zone,
      dateTime: isoAt(daysAgo, 7 + (i % 10), (i * 13) % 60),
      describe: `Routine ${entry.entry.toLowerCase()} pass`,
      fixtureType: entry.fixtureType,
      fixture: entry.fixture,
      service: entry.service,
      assignedTo: ASSIGNEES[i % ASSIGNEES.length],
      createdBy: CREATED_BY,
      address: biz.address,
    };
  });
}

// Lowest explicit id is 107799625 — the generated floor sits below it so
// generated ids never collide with the explicit set.
export const MOCK_REFERENCE_DOCUMENTS: ReferenceDocument[] = [...EXPLICIT, ...generate()];
