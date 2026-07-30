/**
 * Program-level option lists served by both fixtureFormOptions and
 * maintenanceFormOptions. Neither feature owns them, so they live here rather
 * than in one feature's store with the other reaching across for them.
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
