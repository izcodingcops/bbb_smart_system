/**
 * The Add Equipment mockup's static option lists, ported verbatim from
 * `equipment-add.js` (its `CATEGORIES` / `TYPES` / `MAKES` / `MODELS` /
 * `FUEL` / `INCIDENTS` / `POIS` / `MAINTENANCE`).
 *
 * Ownership and Unit are deliberately absent: they already exist as the
 * `EquipmentOwnership` / `EquipmentUnit` unions in `src/types/equipment.ts`
 * and the resolver emits them from the GraphQL enum, so a second copy here
 * would be a third source of truth.
 *
 * The tree below is only the *static* half of the taxonomy. `resolvers.ts`
 * merges it with every (category, type, make, model) tuple actually present
 * in the store, so a seeded record whose category the mockup never listed
 * (e.g. 'Bicycle') stays editable.
 */

/** Category names, in the mockup's own order. */
export const TAXONOMY_CATEGORIES: string[] = [
  'Vehicle',
  'Communication Device',
  'Cleaning Equipment',
  'Power Tool',
  'Safety Gear',
  'Landscaping Equipment',
];

/** Category → types. */
export const TAXONOMY_TYPES: Record<string, string[]> = {
  Vehicle: ['Van', 'Pickup Truck', 'Utility Cart', 'E-Bike'],
  'Communication Device': ['Phone', 'Two-Way Radio', 'Tablet'],
  'Cleaning Equipment': [
    'Pressure Washer',
    'Vacuum',
    'Sweeper',
    'Litter Picker',
  ],
  'Power Tool': ['Drill', 'Blower', 'Hedge Trimmer'],
  'Safety Gear': ['Hi-Vis Vest', 'Hard Hat', 'Harness'],
  'Landscaping Equipment': ['Mower', 'Edger', 'Water Tank'],
};

/** Type → makes. */
export const TAXONOMY_MAKES: Record<string, string[]> = {
  Van: ['Ford', 'Mercedes-Benz'],
  'Pickup Truck': ['Ford', 'Chevrolet'],
  'Utility Cart': ['Club Car', 'Polaris'],
  'E-Bike': ['Rad Power', 'Trek'],
  Phone: ['Apple', 'Samsung'],
  'Two-Way Radio': ['Motorola', 'Kenwood'],
  Tablet: ['Apple', 'Lenovo'],
  'Pressure Washer': ['Karcher', 'Simpson'],
  Vacuum: ['Billy Goat', 'Karcher'],
  Sweeper: ['Tennant', 'Nilfisk'],
  'Litter Picker': ['Unger', 'Gator'],
  Drill: ['DeWalt', 'Makita'],
  Blower: ['Stihl', 'Echo'],
  'Hedge Trimmer': ['Stihl', 'Husqvarna'],
  'Hi-Vis Vest': ['Ergodyne', 'Radians'],
  'Hard Hat': ['MSA', '3M'],
  Harness: ['MSA', 'Petzl'],
  Mower: ['Toro', 'John Deere'],
  Edger: ['Echo', 'Stihl'],
  'Water Tank': ['Rubbermaid', 'Snyder'],
};

/** Make → models. */
export const TAXONOMY_MODELS: Record<string, string[]> = {
  Ford: ['Transit 250', 'F-150 XL'],
  'Mercedes-Benz': ['Sprinter 2500'],
  Chevrolet: ['Silverado 1500'],
  'Club Car': ['Carryall 500'],
  Polaris: ['Ranger EV'],
  'Rad Power': ['RadRunner 3'],
  Trek: ['Verve+ 2'],
  Apple: ['iPhone 15', 'iPad 10th Gen'],
  Samsung: ['Galaxy A54'],
  Motorola: ['CP200d', 'APX 4000'],
  Kenwood: ['NX-1300'],
  Lenovo: ['Tab M10'],
  Karcher: ['HD 4/20', 'NT 30/1'],
  Simpson: ['ALH3228-S'],
  'Billy Goat': ['KV601SP'],
  Tennant: ['S680'],
  Nilfisk: ['SW900'],
  Unger: ['Nifty Nabber'],
  Gator: ['Grabber Pro'],
  DeWalt: ['DCD791'],
  Makita: ['XFD13'],
  Stihl: ['BR 800', 'HS 82 R', 'FC 56 C'],
  Echo: ['PB-2620', 'PAS-225'],
  Husqvarna: ['122HD45'],
  Ergodyne: ['GloWear 8210Z'],
  Radians: ['SV2ZGM'],
  MSA: ['V-Gard', 'Workman'],
  '3M': ['SecureFit'],
  Petzl: ['Newton'],
  Toro: ['TimeMaster 30'],
  'John Deere': ['S120'],
  Rubbermaid: ['BRUTE 44'],
  Snyder: ['65 Gal Leg Tank'],
};

/**
 * Connected Elements option lists. Free text in this app — these modules'
 * own records are not joined to equipment, matching the mockup.
 *
 * The dates baked into the incident and maintenance labels are part of the
 * option string itself, not a record date: nothing parses them, they are
 * never compared against the clock, and no Date Range filter reads them. They
 * are left literal on purpose, so the project's relative-dates rule for mocks
 * does not apply here.
 */
export const CONNECTED_INCIDENTS: string[] = [
  'Graffiti — 07/04/2026',
  'Vandalism — 07/03/2026',
  'Broken Glass — 06/28/2026',
  'Illegal Dumping — 06/21/2026',
];

export const CONNECTED_POIS: string[] = [
  'R. Blake',
  'M. Ortiz',
  'D. Whitfield',
  'T. Nguyen',
  'S. Alvarez',
];

export const CONNECTED_MAINTENANCE: string[] = [
  '#MT-4471 — Alley Cleaning',
  '#MT-4460 — Light Out',
  '#MT-4432 — Bench Repair',
  '#MT-4419 — Signage Damage',
];

/** 'Vehicle is on'. */
export const FUEL_OPTIONS: string[] = ['Gas', 'Electricity'];
