export type PoiDisposition =
  | 'Active'
  | 'Deceased'
  | 'Housed'
  | 'In-active'
  | 'Incarcerated'
  | 'Transitional Care';

export interface PoiCreator {
  name: string;
  /** Two letters for the avatar circle, e.g. 'JC'. */
  initials: string;
}

/** A repeating card in the person form's Contacts section. */
export interface PoiContact {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  notes: string;
}

/** Create-only. No edit or delete endpoint exists for these. */
export interface PoiInteraction {
  /** Opaque server identifier. Never displayed — use `reference`. */
  id: string;
  /** Display reference, carrying its own '#', e.g. '#INT-9007'. */
  reference: string;
  interactionType: string;
  /** ISO-8601. */
  occurredAt: string;
  zone: string;
  fixture: string | null;
  businessLocation: string | null;
  violation: string | null;
  note: string | null;
  documents: string[];
}

/** Create-only, like PoiInteraction. */
export interface PoiUpdate {
  id: string;
  /** Display reference, e.g. '#UPD-3301'. */
  reference: string;
  /** ISO-8601. */
  occurredAt: string;
  zone: string;
  description: string;
}

/** What a list card shows. */
export interface Poi {
  /** Opaque server identifier. Never displayed — use `reference`. */
  id: string;
  /** Display reference, carrying its own '#', e.g. '#POI-4021'. */
  reference: string;
  name: string;
  personType: string;
  disposition: PoiDisposition;
  /**
   * Stamped at create from device state — the person form never asks for it.
   * See the Location decision in the module's design doc.
   */
  zone: string;
  address: string;
  /**
   * Derived from the timeline at the wire boundary, so a card never has to
   * load one and the two can't drift.
   */
  interactionCount: number;
  createdBy: PoiCreator;
  /** A plain record field, not derived from live connectivity. */
  queuedOffline: boolean;
  /** ISO-8601. The card's date line, and what 'Latest first' sorts on. */
  lastModifiedAt: string;
}

/** Everything the View/Edit screens show beyond the list card. */
export interface PoiDetail extends Poi {
  /** ISO-8601 — when this person was first logged. */
  firstSeenAt: string;
  lastModifiedBy: string | null;
  /** Phone number or email — one required field, either form. */
  contact: string | null;

  top1020: boolean;
  alias: string | null;
  gender: string | null;
  age: string | null;
  race: string | null;
  weight: string | null;
  height: string | null;
  physicalDescription: string | null;
  situation: string | null;

  /**
   * Never collected by the form — the mockup defines a person Location section
   * and then never renders it — so this is null on every record the app
   * creates, and populated only on seeded ones.
   */
  describeLocation: string | null;

  contacts: PoiContact[];
  connectedIncidents: string[];
  connectedMaintenance: string[];
  connectedEquipment: string[];

  interactions: PoiInteraction[];
  updates: PoiUpdate[];
}

/**
 * What the mock store holds. `interactionCount` is computed from the timeline
 * on the way out, so the stored record must not carry its own copy.
 */
export type PoiRecord = Omit<PoiDetail, 'interactionCount'>;

/** What the Create/Edit person form edits and submits. */
export interface PoiFormValues {
  name: string;
  personType: string;
  disposition: PoiDisposition;
  /** ISO-8601. The mockup's auto-filled 'Date & Time'. */
  occurredAt: string;
  contact: string;
  top1020: boolean;
  alias: string;
  gender: string;
  age: string;
  race: string;
  weight: string;
  height: string;
  physicalDescription: string;
  situation: string;
  contacts: PoiContact[];
  connectedIncidents: string[];
  connectedMaintenance: string[];
  connectedEquipment: string[];
}

export interface PoiInteractionFormValues {
  /** Opaque person id. Locked when opened from a card or the detail screen. */
  personId: string;
  interactionType: string;
  /** ISO-8601. */
  occurredAt: string;
  zone: string;
  fixture: string;
  businessLocation: string;
  violation: string;
  note: string;
  documents: string[];
}

export interface PoiUpdateFormValues {
  personId: string;
  /** ISO-8601. */
  occurredAt: string;
  zone: string;
  description: string;
}

/**
 * A person the Interaction and Update pickers point at. Carries the id as well
 * as the name because a name is not a key — two people can share one.
 */
export interface PoiPerson {
  id: string;
  name: string;
}

export interface PoiFormOptions {
  nextReference: string;
  personTypes: string[];
  dispositions: string[];
  genders: string[];
  races: string[];
  incidentOptions: string[];
  maintenanceOptions: string[];
  equipmentOptions: string[];
}

export interface PoiInteractionFormOptions {
  nextReference: string;
  people: PoiPerson[];
  interactionTypes: string[];
  violations: string[];
  zones: string[];
  fixtures: string[];
  businessLocations: string[];
}

export interface PoiUpdateFormOptions {
  nextReference: string;
  people: PoiPerson[];
  zones: string[];
}
