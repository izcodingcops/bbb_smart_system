/**
 * Program-level option lists served by more than one feature's form options.
 * No feature owns them, so they live here rather than in one feature's store
 * with the others reaching across for them.
 */
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
export const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'];

/**
 * Maintenance's own list, now shared with WorkLog too — the old app served
 * both from the one `outReach/businessDropdown` endpoint, and the two
 * modules' hardcoded lists had drifted into a near-duplicate (WorkLog's
 * 'Denver Pavilions'/'Union Station'/'Larimer Square' matched exactly;
 * '16th Street Mall' didn't match Maintenance's '16th St Mall'). This is the
 * merged, canonical version. POI's own business list (`BUSINESS_LOCATIONS` in
 * `src/mocks/poi.ts`) stays separate on purpose — it names specific venues
 * ('Union Station Retail'), a different and more granular concept than this
 * list's general locations.
 */
export const BUSINESS_NAMES = [
  '16th St Mall',
  'Union Station',
  'Larimer Square',
  'Civic Center',
  'BlockByBlock',
  'LoDo District',
  'Denver Pavilions',
];

/**
 * The named zones the Supervisor handoff uses, verbatim and in its own order —
 * served by both offHoursVisitFormOptions and shiftNoteFormOptions, whose
 * mockups carry an identical list.
 *
 * Deliberately separate from `ZONES` above, which is what the Ambassador-era
 * fixture and maintenance forms were built against. Which vocabulary a real
 * program actually has is a gateway question; collapsing the two here would be
 * guessing at the answer.
 */
export const PROGRAM_ZONES = [
  'Downtown Louisville',
  'RiverFront',
  'Waterfront Park',
  'Southern Indiana',
  'South IN 2',
  'Beachmont',
  'testzone2222',
  'map box',
];

/**
 * The program's ambassador roster, as the Shift Notes handoff lists it.
 *
 * Spellings are the customer's own — the placeholder `'ambassador, test'`
 * account and the mixed `Last, First` / `First Last` forms are how the data
 * reads, not something to normalise here.
 */
export const AMBASSADORS = [
  'ambassador, test',
  'Allie Barker',
  'Cam Hurd',
  'Arslan saeed',
  'Chad Williamson',
  'Barnes, Teeya',
  'Boone Jr., Anthony',
  'Dale, Kenneth',
];
