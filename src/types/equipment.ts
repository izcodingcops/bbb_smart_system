export type EquipmentStatus = 'Active' | 'Checked-Out';
export type EquipmentOwnership = 'Owned' | 'Leased' | 'Rented' | 'Loaned';
export type EquipmentUnit = 'Miles' | 'Hours' | 'Kilometers' | 'None';

/**
 * Three distinct strings, all `string`, all displayed or matched somewhere:
 * `id` routes, `reference` shows in the detail identifier row and in dialog
 * copy, `serial` is the card headline and what a QR code encodes. The mocks
 * give all three visibly different values so a swap shows up on screen.
 */
export interface Equipment {
  id: string;
  reference: string;
  serial: string;
  name: string;
  equipmentType: string;
  category: string;
  make: string;
  model: string;
  zone: string;
  program: string;
  region: string;
  division: string;
  status: EquipmentStatus;
  /** ISO-8601. The card's date row, and what Date Range filters on. */
  createdAt: string;
  acquiredAt: string | null;
  unit: EquipmentUnit;
  /** 'Beg. Miles/Hours' on the detail screen. */
  beginningUsage: string | null;
  year: string | null;
  ownership: EquipmentOwnership;
  description: string | null;
  /** Display name of the holder; null when Active. 'Me' is resolved at the card. */
  checkedOutBy: string | null;
  checkedOutAt: string | null;
  /**
   * Stored, not derived. The source mockup carries the same flag on its own
   * records, and deriving it from a name comparison would break the moment a
   * check-out mutation writes a real user's name instead of the seed's.
   */
  mine: boolean;
  queuedOffline: boolean;
}

export interface EquipmentUpkeep {
  id: string;
  upkeepType: string;
  /** ISO-8601. */
  occurredAt: string;
  vendor: string | null;
  cost: string | null;
  currentUsage: string | null;
  zone: string | null;
  description: string | null;
}

export interface EquipmentDetail extends Equipment {
  /** 'Vehicle is on' — Gas | Electricity. Null for non-vehicles. */
  fuel: string | null;
  images: string[];
  upkeeps: EquipmentUpkeep[];
  incidents: string[];
  personsOfInterest: string[];
  maintenance: string[];
}

export interface CheckOutEquipmentValues {
  /** ISO-8601. */
  occurredAt: string;
  hasAbnormality: boolean;
  /** Required when `hasAbnormality`; null otherwise. */
  abnormality: string | null;
  description: string;
  images: string[];
}

export interface CheckInEquipmentValues {
  /** ISO-8601. */
  occurredAt: string;
  /** Free text — 'hours, miles' per the form's own question. */
  currentUsage: string;
  hasAbnormality: boolean;
  abnormality: string | null;
  description: string;
  images: string[];
}

export interface EquipmentUpkeepValues {
  upkeepType: string;
  /** ISO-8601. */
  occurredAt: string;
  vendor: string;
  currentUsage: string;
  cost: string;
  zone: string | null;
  description: string;
  images: string[];
}

export interface EquipmentFormOptions {
  upkeepTypes: string[];
  abnormalities: string[];
  zones: string[];
}
