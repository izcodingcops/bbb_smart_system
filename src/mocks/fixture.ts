import {Fixture, FixtureCreator, FixtureStatus} from '../types/fixture';

const ADDRESSES: Record<string, string> = {
  '16th St Mall': '16th St Mall, Denver, CO 80202',
  LoDo: '1601 Wewatta St, Denver, CO 80202',
  'Union Station': '1701 Wynkoop St, Denver, CO 80202',
  Larimer: '1430 Larimer St, Denver, CO 80202',
  'Civic Center': 'Civic Center Park, Denver, CO 80202',
  Blake: '2001 Blake St, Denver, CO 80205',
  Curtis: '16th & Curtis St, Denver, CO 80202',
  'Curtis Kiosk': '900 Curtis St, Denver, CO 80202',
};

const YOU: FixtureCreator = {name: 'You', initials: 'YO'};
const MARCUS: FixtureCreator = {name: 'Marcus Bell', initials: 'MB'};
const SARA: FixtureCreator = {name: 'Sara Diaz', initials: 'SD'};
const AVA: FixtureCreator = {name: 'Ava Nguyen', initials: 'AN'};

/** The 10 records the design's mockup pins exact values for. */
const EXPLICIT: Fixture[] = [
  {
    id: 'fx_42984',
    reference: '#FX-42984',
    title: '16th St Floor Fixture',
    fixtureType: 'Floor Fixture',
    zone: 'Zone 4',
    status: 'Active',
    createdBy: YOU,
    queuedOffline: false,
    createdAt: '2026-07-29T10:05:00',
    address: ADDRESSES['16th St Mall'],
  },
  {
    id: 'fx_42960',
    reference: '#FX-42960',
    title: 'LoDo Bike Rack 12',
    fixtureType: 'Bike Rack',
    zone: 'Zone 5',
    status: 'Inactive',
    createdBy: MARCUS,
    queuedOffline: false,
    createdAt: '2026-07-29T08:40:00',
    address: ADDRESSES.LoDo,
  },
  {
    id: 'fx_42931',
    reference: '#FX-42931',
    title: 'Union Station Bench A',
    fixtureType: 'Bench',
    zone: 'Zone 2',
    status: 'Active',
    createdBy: YOU,
    queuedOffline: false,
    createdAt: '2026-07-28T16:20:00',
    address: ADDRESSES['Union Station'],
  },
  {
    id: 'fx_42905',
    reference: '#FX-42905',
    title: 'Larimer Planter 07',
    fixtureType: 'Planter',
    zone: 'Zone 1',
    status: 'Inactive',
    createdBy: SARA,
    queuedOffline: false,
    createdAt: '2026-07-28T11:15:00',
    address: ADDRESSES.Larimer,
  },
  {
    id: 'fx_42888',
    reference: '#FX-42888',
    title: 'Civic Center Trash Bin 3',
    fixtureType: 'Trash Receptacle',
    zone: 'Zone 3',
    status: 'Active',
    createdBy: YOU,
    queuedOffline: true,
    createdAt: '2026-07-27T17:30:00',
    address: ADDRESSES['Civic Center'],
  },
  {
    id: 'fx_42860',
    reference: '#FX-42860',
    title: 'Blake St Light Pole 22',
    fixtureType: 'Light Pole',
    zone: 'Zone 3',
    status: 'Inactive',
    createdBy: AVA,
    queuedOffline: false,
    createdAt: '2026-07-27T09:50:00',
    address: ADDRESSES.Blake,
  },
  {
    id: 'fx_42834',
    reference: '#FX-42834',
    title: 'Wynkoop Bollard 5',
    fixtureType: 'Bollard',
    zone: 'Zone 2',
    status: 'Active',
    createdBy: YOU,
    queuedOffline: false,
    createdAt: '2026-07-26T14:10:00',
    address: ADDRESSES['Union Station'],
  },
  {
    id: 'fx_42810',
    reference: '#FX-42810',
    title: '16th St Sign Post B',
    fixtureType: 'Sign Post',
    zone: 'Zone 4',
    status: 'Inactive',
    createdBy: MARCUS,
    queuedOffline: false,
    createdAt: '2026-07-26T10:50:00',
    address: ADDRESSES.Curtis,
  },
  {
    id: 'fx_42788',
    reference: '#FX-42788',
    title: 'Larimer Bench 09',
    fixtureType: 'Bench',
    zone: 'Zone 1',
    status: 'Active',
    createdBy: YOU,
    queuedOffline: false,
    createdAt: '2026-07-25T15:35:00',
    address: ADDRESSES.Larimer,
  },
  {
    id: 'fx_42760',
    reference: '#FX-42760',
    title: 'Curtis St Kiosk',
    fixtureType: 'Kiosk',
    zone: 'Zone 2',
    status: 'Inactive',
    createdBy: SARA,
    queuedOffline: false,
    createdAt: '2026-06-24T07:40:00',
    address: ADDRESSES['Curtis Kiosk'],
  },
];

const GEN_TYPES = [
  'Trash Receptacle',
  'Light Pole',
  'Bollard',
  'Sign Post',
  'Kiosk',
  'Drinking Fountain',
  'Floor Fixture',
  'Bench',
  'Bike Rack',
  'Planter',
];
const GEN_ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'];
const GEN_CREATORS = [YOU, MARCUS, SARA, AVA];
const GEN_ADDRESS_KEYS = Object.keys(ADDRESSES);
const GEN_TITLE_PREFIX = [
  'North Plaza',
  'South Court',
  'East Corridor',
  'West Row',
  'Central Walk',
];

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
const GEN_BASE = new Date('2026-07-24T18:00:00').getTime();

/**
 * Ids count down from 42730, staying clear of every explicit id above (the
 * lowest of those is #FX-42760), so no id can collide.
 */
const GENERATED: Fixture[] = Array.from({length: 15}, (_, i) => {
  const type = GEN_TYPES[i % GEN_TYPES.length];
  const zone = GEN_ZONES[i % GEN_ZONES.length];
  const addressKey = GEN_ADDRESS_KEYS[i % GEN_ADDRESS_KEYS.length];
  const status: FixtureStatus = i % 2 === 0 ? 'Active' : 'Inactive';
  return {
    id: `fx_${42730 - i * 3}`,
    reference: `#FX-${42730 - i * 3}`,
    title: `${GEN_TITLE_PREFIX[i % GEN_TITLE_PREFIX.length]} ${type} ${i + 1}`,
    fixtureType: type,
    zone,
    status,
    createdBy: GEN_CREATORS[i % GEN_CREATORS.length],
    queuedOffline: false,
    createdAt: toLocalIso(new Date(GEN_BASE - i * 9 * HOUR)),
    address: ADDRESSES[addressKey],
  };
});

export const MOCK_FIXTURES: Fixture[] = [...EXPLICIT, ...GENERATED];
