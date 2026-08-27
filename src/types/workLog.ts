export type YesNo = 'yes' | 'no';

/** Cleaning's 16 entry types — the shift's confirmed field list, shared by
 *  Management until Management gets its own mockup-confirmed list (there is
 *  none yet). Order matches the source mockup. */
export const CLEANING_ENTRY_TYPES = [
  'Litter Pickup',
  'Graffiti Removal',
  'Sidewalk Sweep',
  'Trash Bin Empty',
  'Pressure Washing',
  'Weed Removal',
  'Spill Cleanup',
  'Gum Removal',
  'Elevator Check',
  'Change Light Bulb',
  'Accessibility Assistance',
  'Alley Check',
  'Restroom Check',
  'Planter Watering',
  'Leaf Removal',
  'Call for Service Template',
] as const;

/** Real (scraped) General shift entry types, ported verbatim from the
 *  "Add General Work" standalone export — includes QA-test-looking names
 *  because the source data does; this repo's convention is scraped records
 *  stay as scraped, not cleaned up (.claude/rules/data-module-conventions.md). */
export const GENERAL_ENTRY_TYPES = [
  'Test Ac 24 Aug',
  'Test Activity 12 Alias',
  'Test Business Report Alias',
  'Regresssion 27/07',
  'Test9595',
  '24 July Regression Testing',
  'Test 6677',
  'Test Activity 12',
  'V1',
  'Test Business Report',
  'Activity New Created',
  'Activity New',
  'Activity UPDATED',
  'Act WW',
  'Other - Stats',
  'Report - Web Form Submission',
] as const;

/** Real (scraped) Hospitality shift entry types, ported verbatim from the
 *  "Add Hospitality Work" standalone export. */
export const HOSPITALITY_ENTRY_TYPES = [
  'Teste 31',
  'Call For Service Act',
  'WWW Activity',
  'Test',
  'Interaction - Event Hospitality',
  'Report - Station Check',
  'Engagement - Public',
  'Accessibility Assistance',
  'Interaction - Special Events',
  'Report - Wildlife Harassment',
  'Report - Injured Wildlife',
  'Report - Enforcement Issue',
  'Report - Volunteer Issues',
  'Report - Vendor Issue',
  'Report - Broken Benches',
  'Report - Fallen Branches',
  'Interaction - Referrals',
  'Interaction - Reminder - Illegal Vendor Chat',
  'Interaction - Reminder - Fishing Area',
  'Report - Wildlife Talks',
  'Interaction - Reminder - Off Leash Dogs',
  'Interaction - Pet Relief Area',
  'Interaction - Transport 2',
  'Interaction - Terminal ID',
  'Interaction - Departure Gates',
  'Interaction - Panhandling',
  'Report - Unattended Bags',
  'Interaction - Rental Car Information',
  'Interaction - Airline Information',
  '911 Call - Police Fire EMS',
  'Interaction - Free Rider',
  'Incident - Scooter Damage 2',
  'Incident - Scooter Damage 1',
  'Engagement - Welfare Check Medical Emergency',
  'Engagement - Welfare Check Unsheltered',
  'Report - Feedback',
  'Interaction - General Questions',
  'Engagement - Food Or Water Distribution',
  'Engagement - Call For Outreach',
  'Incident - Public Demonstration',
  'Incident - Art Piece Damaged',
  'Incident - Parking Violations',
  'Engagement - Welfare Check',
  'Engagement - Unsheltered',
  'Interaction - Hospitality Program',
  'Report - Observation',
  'Report - Observation Illegal',
  'Interaction - First Aid',
  'Interaction - Feedback On Experience 3',
  'Interaction - Art Assist',
  'Interaction - Area Of Interest',
  'Other - Safe Routes To School',
  'Interaction - Kiosk In Town',
  'Interaction - Kiosk Out Of Town',
] as const;

/** Real (scraped) Outreach shift entry types, ported verbatim from the
 *  "Add Outreach Work" standalone export — only 2 records exist in the
 *  source data. */
export const OUTREACH_ENTRY_TYPES = [
  'Ahr 9 August',
  'Audit - Unhoused',
] as const;

/** Real (scraped) Safety shift entry types, ported verbatim from the
 *  "Add Safety Work" standalone export. */
export const SAFETY_ENTRY_TYPES = [
  'SDF - Activity Safety Test',
  'Test-For Safety Concern',
  'Request For PD/EMS/FIRE',
  'Elevator Check',
  'Incident Reports Written Alias',
] as const;

/** MOCK_SHIFT_TYPES id -> that shift's entry-type list. Management ('st4')
 *  has no mockup of its own yet, so it falls back to Cleaning's confirmed
 *  list rather than guessing at one — see isDetailedFormShift below, which
 *  groups Management with Cleaning for the same reason. */
export const ENTRY_TYPES_BY_SHIFT_TYPE_ID: Record<string, readonly string[]> = {
  st1: CLEANING_ENTRY_TYPES, // Cleaning
  st2: GENERAL_ENTRY_TYPES, // General
  st3: HOSPITALITY_ENTRY_TYPES, // Hospitality
  st4: CLEANING_ENTRY_TYPES, // Management
  st5: OUTREACH_ENTRY_TYPES, // Outreach
  st6: SAFETY_ENTRY_TYPES, // Safety
};

export function entryTypesForShift(
  shiftTypeId: string | null | undefined,
): readonly string[] {
  return (shiftTypeId && ENTRY_TYPES_BY_SHIFT_TYPE_ID[shiftTypeId]) || CLEANING_ENTRY_TYPES;
}

/** Shift types with a confirmed, shift-specific Basic Details field list
 *  (Machine No + the 5 FVM Yes/No questions below). Every other shift type
 *  — General, Hospitality, Outreach, Safety, and by extension Management,
 *  which has no confirmed list of its own — gets the generic Quantity +
 *  Description placeholder form instead, until that shift's own field list
 *  is confirmed. Keyed by MOCK_SHIFT_TYPES id. */
export const DETAILED_FORM_SHIFT_TYPE_IDS: readonly string[] = ['st1', 'st4'];

export function isDetailedFormShift(
  shiftTypeId: string | null | undefined,
): boolean {
  return !!shiftTypeId && DETAILED_FORM_SHIFT_TYPE_IDS.includes(shiftTypeId);
}

export interface WorkLogEntry {
  /** Opaque server identifier. Never displayed — use `reference`. */
  id: string;
  /** Display reference, a raw 8-digit number carrying its own '#', e.g. '#76231707'. */
  reference: string;
  /** MOCK_SHIFT_TYPES id, frozen at creation — which shift this was logged under. */
  shiftTypeId: string;
  /** Denormalized display name at creation time, e.g. 'Cleaning'. Drives every
   *  piece of shift-specific text on this record's own screens. */
  shiftTypeName: string;
  entryType: string;

  /** ISO-8601, auto-filled from the device clock at creation, editable. */
  requestDateTime: string;

  /** Cleaning/Management-only fields — present only when
   *  isDetailedFormShift(shiftTypeId) is true. */
  machineNo?: string;
  fvmAccessibilityChecked?: YesNo;
  bridgePlateSecured?: YesNo;
  accessibleFareGateWorking?: YesNo;
  automaticDoorWorking?: YesNo;
  fvmNotWorking?: YesNo;

  /** General/Hospitality/Outreach/Safety-only field — present only when
   *  isDetailedFormShift(shiftTypeId) is false. */
  description?: string;

  address: string;
  zone: string | null;
  describeLocation: string;
  businessName: string | null;
  /** Stored as a zero-padded decimal string ('01'), matching the stepper's own display. */
  quantity: string;

  loggedBy: string;
  /** ISO-8601. */
  createdAt: string;
}

/** What the Create/Edit form edits and submits — the five yes/no answers stay
 *  nullable until the ambassador picks one, unlike the submitted record. Every
 *  field from both shift shapes is always present here (the form only renders
 *  one half, per isDetailedFormShift) so switching WorkLogForm's branch never
 *  needs to reshape this object, just show/hide part of it. */
export interface WorkLogFormValues {
  entryType: string;
  requestDateTime: string;
  machineNo: string;
  fvmAccessibilityChecked: YesNo | null;
  bridgePlateSecured: YesNo | null;
  accessibleFareGateWorking: YesNo | null;
  automaticDoorWorking: YesNo | null;
  fvmNotWorking: YesNo | null;
  description: string;
  address: string;
  zone: string | null;
  describeLocation: string;
  businessName: string | null;
  quantity: string;
}

export interface WorkLogFormOptions {
  nextReference: string;
  entryTypes: string[];
  zones: string[];
  businessNames: string[];
}
