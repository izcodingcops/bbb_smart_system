export type YesNo = 'yes' | 'no';

/** The 16 entry types, shared by every shift type — order matches the source mockup. */
export const ENTRY_TYPES = [
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

  machineNo: string;
  /** ISO-8601, auto-filled from the device clock at creation, editable. */
  requestDateTime: string;
  fvmAccessibilityChecked: YesNo;
  bridgePlateSecured: YesNo;
  accessibleFareGateWorking: YesNo;
  automaticDoorWorking: YesNo;
  fvmNotWorking: YesNo;

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
 *  nullable until the ambassador picks one, unlike the submitted record. */
export interface WorkLogFormValues {
  entryType: string;
  machineNo: string;
  requestDateTime: string;
  fvmAccessibilityChecked: YesNo | null;
  bridgePlateSecured: YesNo | null;
  accessibleFareGateWorking: YesNo | null;
  automaticDoorWorking: YesNo | null;
  fvmNotWorking: YesNo | null;
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
