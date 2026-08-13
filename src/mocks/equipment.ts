import {
  Equipment,
  EquipmentDetail,
  EquipmentItem,
  EquipmentOwnership,
  EquipmentUnit,
} from '../types/equipment';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Timezone-naive, matching every other mock in this repo. */
function toLocalIso(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

/** Midnight today — the same anchor `matchesDateRange` uses. */
const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();

/**
 * `days` back from midnight today at `hour` local. Anchoring to midnight
 * rather than to `Date.now()` keeps every Date Range bucket deterministic no
 * matter what time the app is launched — the mockup's own fixed July 2026
 * dates would leave Today, Yesterday and Last 7 days permanently empty.
 */
function at(days: number, hour: number): string {
  return toLocalIso(new Date(TODAY - days * DAY + hour * HOUR));
}

const TRAINING = {
  program: 'Louisville KY Training BBB 0000',
  region: '914',
  division: 'Central',
};
const BLOCK_CITY = {
  program: 'Louisville KY Block City Dispatch 0000',
  region: 'North',
  division: 'Punjab',
};

/**
 * The 13 records the mockup pins exact values for — its `MINE` (5), `OTHERS`
 * (2) and `AVAIL` (8) arrays, merged the way `allEquip()` merges them.
 * `werrtyui` and `SN-4335-DW` appear in both `AVAIL` and `MINE`, so the merged
 * pool is 13, not 15.
 *
 * `program`/`region`/`division` are seeded on every record. The mockup only
 * sets them on `MINE`/`OTHERS`, which makes its own Program/Region/Division
 * filters silently drop the entire available pool — a source bug, not a spec.
 */
const EXPLICIT: Equipment[] = [
  // --- Checked out by the signed-in user -----------------------------------
  {
    id: 'eq_4352',
    reference: '#4352',
    serial: 'werrtyui',
    name: 'Car 1700cc',
    equipmentType: 'Mobile Cleaning Unit',
    category: 'Power Wash Truck',
    make: 'Hydro Tek',
    model: 'Other',
    zone: 'Testzone2222',
    ...TRAINING,
    status: 'Checked-Out',
    createdAt: at(0, 10),
    acquiredAt: '2026-07-22T09:28:00',
    unit: 'Miles',
    beginningUsage: null,
    year: null,
    ownership: 'Owned',
    description: null,
    checkedOutBy: 'You',
    checkedOutAt: at(0, 10),
    mine: true,
    queuedOffline: false,
  },
  {
    id: 'eq_4337',
    reference: '#4337',
    serial: 'SN-4337-AX',
    name: 'Body Cam 22',
    equipmentType: 'Body Camera',
    category: 'Communication Device',
    make: 'Axon',
    model: 'e4',
    zone: 'Zone 2',
    ...TRAINING,
    status: 'Checked-Out',
    createdAt: at(0, 6),
    acquiredAt: '2026-05-12T08:40:00',
    unit: 'Hours',
    beginningUsage: null,
    year: '2024',
    ownership: 'Owned',
    description:
      'Chest-mounted body camera assigned to the downtown patrol pool.',
    checkedOutBy: 'You',
    checkedOutAt: at(0, 6),
    mine: true,
    queuedOffline: false,
  },
  {
    id: 'eq_4339',
    reference: '#4339',
    serial: 'SN-4339-TK',
    name: 'Patrol Bike 07',
    equipmentType: 'Info-Trike',
    category: 'Bicycle',
    make: 'Trek',
    model: 'ATLV',
    zone: 'Zone 1',
    ...TRAINING,
    status: 'Checked-Out',
    createdAt: at(1, 7),
    acquiredAt: '2026-03-02T09:00:00',
    unit: 'Miles',
    beginningUsage: '420',
    year: '2023',
    ownership: 'Owned',
    description: null,
    checkedOutBy: 'You',
    checkedOutAt: at(1, 7),
    mine: true,
    queuedOffline: false,
  },
  {
    id: 'eq_4340',
    reference: '#4340',
    serial: 'SN-4340-AP',
    name: 'Handheld Unit 12',
    equipmentType: 'Phone',
    category: 'Communication Device',
    make: 'Apple',
    model: 'Iphone',
    zone: 'Zone 2',
    ...BLOCK_CITY,
    status: 'Checked-Out',
    createdAt: at(1, 14),
    acquiredAt: '2026-01-15T09:00:00',
    unit: 'Hours',
    beginningUsage: null,
    year: '2024',
    ownership: 'Owned',
    description: 'Standard-issue field handset.',
    checkedOutBy: 'You',
    checkedOutAt: at(1, 14),
    mine: true,
    queuedOffline: false,
  },
  {
    id: 'eq_4335',
    reference: '#4335',
    serial: 'SN-4335-DW',
    name: 'Saw Kit 9',
    equipmentType: 'Chainsaw',
    category: 'Landscape Power Tool',
    make: 'Dewalt',
    model: '1500',
    zone: 'Zone 4',
    ...TRAINING,
    status: 'Checked-Out',
    createdAt: at(3, 16),
    acquiredAt: '2026-02-18T10:20:00',
    unit: 'Hours',
    beginningUsage: null,
    year: '2022',
    ownership: 'Rented',
    description: null,
    checkedOutBy: 'You',
    checkedOutAt: at(3, 16),
    mine: true,
    queuedOffline: false,
  },

  // --- Checked out by other people -----------------------------------------
  {
    id: 'eq_4336',
    reference: '#4336',
    serial: 'SN-4336-JL',
    name: 'Sweeper 04',
    equipmentType: 'Mobile Cleaning Unit',
    category: 'Cleaning Equipment',
    make: 'Billy Goat',
    model: 'ATLV',
    zone: 'Zone 3',
    ...TRAINING,
    status: 'Checked-Out',
    createdAt: at(2, 6),
    acquiredAt: '2026-02-11T08:00:00',
    unit: 'Hours',
    beginningUsage: null,
    year: '2023',
    ownership: 'Owned',
    description: 'Ride-on sweeper assigned to the riverfront route.',
    checkedOutBy: 'Marcus Webb',
    checkedOutAt: at(2, 6),
    mine: false,
    queuedOffline: false,
  },
  {
    id: 'eq_4330',
    reference: '#4330',
    serial: 'SN-4330-CB',
    name: 'Cart Bravo',
    equipmentType: 'Golf Cart',
    category: 'Vehicle',
    make: 'Club Car',
    model: 'e4',
    zone: 'Zone 5',
    ...BLOCK_CITY,
    status: 'Checked-Out',
    createdAt: at(5, 7),
    acquiredAt: '2026-06-03T08:20:00',
    unit: 'Miles',
    beginningUsage: '2,140',
    year: '2024',
    ownership: 'Owned',
    description: null,
    checkedOutBy: 'Dana Whitfield',
    checkedOutAt: at(5, 7),
    mine: false,
    queuedOffline: false,
  },

  // --- Available to check out ----------------------------------------------
  {
    id: 'eq_4341',
    reference: '#4341',
    serial: 'SN-4341-BX',
    name: 'Handheld Unit 19',
    equipmentType: 'Phone',
    category: 'Communication Device',
    make: 'Apple',
    model: 'Iphone',
    zone: 'Zone 2',
    ...TRAINING,
    status: 'Active',
    createdAt: at(2, 8),
    acquiredAt: '2026-07-10T09:00:00',
    unit: 'Hours',
    beginningUsage: null,
    year: '2024',
    ownership: 'Owned',
    description:
      'Standard-issue field handset for the downtown patrol pool.',
    checkedOutBy: null,
    checkedOutAt: null,
    mine: false,
    queuedOffline: false,
  },
  {
    id: 'eq_4338',
    reference: '#4338',
    serial: 'SN-4338-CC',
    name: 'Cart Alpha',
    equipmentType: 'Golf Cart',
    category: 'Vehicle',
    make: 'Club Car',
    model: 'Colorado',
    zone: 'Zone 1',
    ...BLOCK_CITY,
    status: 'Active',
    createdAt: at(4, 11),
    acquiredAt: '2026-05-02T07:45:00',
    unit: 'Miles',
    beginningUsage: '1,204',
    year: '2023',
    ownership: 'Owned',
    description: 'Six-seat utility cart used for perimeter sweeps.',
    checkedOutBy: null,
    checkedOutAt: null,
    mine: false,
    queuedOffline: false,
  },
  {
    id: 'eq_4333',
    reference: '#4333',
    serial: 'SN-4333-BG',
    name: 'Info Trike 2',
    equipmentType: 'Info-Trike',
    category: 'Bicycle',
    make: 'Billy Goat',
    model: 'ATLV',
    zone: 'Zone 3',
    ...TRAINING,
    status: 'Active',
    createdAt: at(6, 13),
    acquiredAt: '2026-04-09T09:10:00',
    unit: 'Miles',
    beginningUsage: '320',
    year: '2023',
    ownership: 'Owned',
    description: 'Mobile info station trike for public events.',
    checkedOutBy: null,
    checkedOutAt: null,
    mine: false,
    queuedOffline: false,
  },
  {
    id: 'eq_4332',
    reference: '#4332',
    serial: 'SN-4332-CH',
    name: 'LSV 6',
    equipmentType: 'Low Speed Vehicle',
    category: 'Vehicle',
    make: 'Chevrolet',
    model: 'Bolt EUV',
    zone: 'Zone 5',
    ...BLOCK_CITY,
    status: 'Active',
    createdAt: at(9, 10),
    acquiredAt: '2026-03-22T08:00:00',
    unit: 'Miles',
    beginningUsage: '4,860',
    year: '2024',
    ownership: 'Owned',
    description: null,
    checkedOutBy: null,
    checkedOutAt: null,
    mine: false,
    queuedOffline: false,
  },
  {
    id: 'eq_4334',
    reference: '#4334',
    serial: 'SN-4334-DL',
    name: 'Field Laptop 3',
    equipmentType: 'Computer',
    category: 'Communication Device',
    make: 'Dell',
    model: 'Elantra',
    zone: 'Zone 2',
    ...TRAINING,
    status: 'Active',
    createdAt: at(12, 9),
    acquiredAt: '2026-01-15T09:00:00',
    unit: 'Hours',
    beginningUsage: null,
    year: '2023',
    ownership: 'Owned',
    description: 'Rugged field laptop used for on-site reporting.',
    checkedOutBy: null,
    checkedOutAt: null,
    mine: false,
    queuedOffline: false,
  },
  {
    id: 'eq_4331',
    reference: '#4331',
    serial: 'SN-4331-BG',
    name: 'Blower 11',
    equipmentType: 'Blower',
    category: 'Cleaning Equipment',
    make: 'Billy Goat',
    model: '2500',
    zone: 'Zone 6',
    ...BLOCK_CITY,
    status: 'Active',
    createdAt: at(24, 15),
    acquiredAt: '2026-04-04T08:30:00',
    unit: 'Hours',
    beginningUsage: null,
    year: '2022',
    ownership: 'Owned',
    description: null,
    checkedOutBy: null,
    checkedOutAt: null,
    mine: false,
    queuedOffline: false,
  },
];

const GEN_CATEGORIES: {category: string; type: string; make: string; model: string}[] = [
  {category: 'Vehicle', type: 'Van', make: 'Ford', model: 'Transit 250'},
  {category: 'Cleaning Equipment', type: 'Pressure Washer', make: 'Karcher', model: 'HD 4/20'},
  {category: 'Power Tool', type: 'Drill', make: 'DeWalt', model: 'DCD791'},
  {category: 'Safety Gear', type: 'Hard Hat', make: 'MSA', model: 'V-Gard'},
  {category: 'Landscaping Equipment', type: 'Mower', make: 'Toro', model: 'TimeMaster 30'},
  {category: 'Communication Device', type: 'Two-Way Radio', make: 'Motorola', model: 'CP200d'},
];
const GEN_ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'];
const GEN_UNITS: EquipmentUnit[] = ['Miles', 'Hours', 'Kilometers', 'None'];
const GEN_OWNERSHIP: EquipmentOwnership[] = ['Owned', 'Leased', 'Rented', 'Loaned'];

/**
 * Ids count down from 4320, clear of every explicit id above (the lowest of
 * those is #4330), so no id or reference can collide.
 */
const GENERATED: Equipment[] = Array.from({length: 12}, (_, i) => {
  const spec = GEN_CATEGORIES[i % GEN_CATEGORIES.length];
  const n = 4320 - i * 2;
  const org = i % 2 === 0 ? TRAINING : BLOCK_CITY;
  return {
    id: `eq_${n}`,
    reference: `#${n}`,
    serial: `SN-${n}-GX`,
    name: `${spec.type} ${i + 1}`,
    equipmentType: spec.type,
    category: spec.category,
    make: spec.make,
    model: spec.model,
    zone: GEN_ZONES[i % GEN_ZONES.length],
    ...org,
    status: 'Active' as const,
    createdAt: at(2 + i * 2, 8 + (i % 8)),
    acquiredAt: '2026-01-08T09:00:00',
    unit: GEN_UNITS[i % GEN_UNITS.length],
    beginningUsage: i % 3 === 0 ? `${1200 + i * 40}` : null,
    year: `${2021 + (i % 4)}`,
    ownership: GEN_OWNERSHIP[i % GEN_OWNERSHIP.length],
    description: null,
    checkedOutBy: null,
    checkedOutAt: null,
    mine: false,
    queuedOffline: false,
  };
});

export const MOCK_EQUIPMENT: Equipment[] = [...EXPLICIT, ...GENERATED];

/**
 * Detail-only extras for the handful of records the mockup shows loaded. Every
 * other record falls back to the store's `DETAIL_DEFAULTS`.
 *
 * The two upkeep entries are the ones the mockup's `eq8` frame pushes onto
 * `Car 1700cc` so the Upkeep Details tab has something to render.
 */
export const MOCK_EQUIPMENT_DETAIL_OVERRIDES: Record<
  string,
  Partial<EquipmentDetail>
> = {
  eq_4352: {
    fuel: 'Gas',
    upkeeps: [
      {
        id: 'up_2',
        upkeepType: 'Body Work',
        occurredAt: at(1, 14),
        vendor: 'Denver Fleet Services',
        cost: '$148.00',
        currentUsage: '12,480',
        zone: 'Testzone2222',
        description: 'Replaced panel and repainted the rear casing.',
      },
      {
        id: 'up_1',
        upkeepType: '20 Jan Tests',
        occurredAt: at(21, 9),
        vendor: 'Alkota Service Center',
        cost: '$62.00',
        currentUsage: '11,020',
        zone: 'Testzone2222',
        description: 'Routine inspection, no issues found.',
      },
    ],
    maintenance: ['#MT-4460 — Light Out'],
  },
  eq_4337: {
    incidents: ['Graffiti — 07/04/2026'],
  },
  eq_4330: {
    fuel: 'Electricity',
    personsOfInterest: ['D. Whitfield'],
  },
};

/* --- Legacy: Home's "Checked-In Equipment" card. Deleted in Task 6. ------ */

export const MOCK_CHECKED_IN_EQUIPMENT = [
  {
    id: '#RDO-4471',
    name: 'Two-Way Radio',
    category: 'Communication',
    checkedInAt: '2026-07-29T07:05:00',
    status: 'Active',
    icon: 'radio',
    tint: '#EDE9FE',
    iconColor: '#6D4AFF',
  },
  {
    id: '#LP-2093',
    name: 'Litter Picker',
    category: 'Cleaning Tool',
    checkedInAt: '2026-07-29T07:06:00',
    status: 'Active',
    icon: 'tool',
    tint: '#DCEBFF',
    iconColor: '#0066B2',
  },
] satisfies EquipmentItem[];
