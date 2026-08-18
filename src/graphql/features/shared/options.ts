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
