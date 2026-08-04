export type DispatchStatus = 'Open' | 'Escalated' | 'Closed';
export type DispatchPriority = 'Low' | 'Medium' | 'High';

/** The list card's shape. */
export interface Dispatch {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, carrying its own prefix, e.g. '#BBB-D 0000-06'. */
  reference: string;
  typeOfActivity: string;
  howReferred: string;
  status: DispatchStatus;
  priority: DispatchPriority;
  /** ISO-8601. */
  createdAt: string;
  address: string;
}

/** One escalation on a dispatch — EMS, Police, Fire, etc. */
export interface DispatchEscalation {
  id: string;
  /** Header label, e.g. 'EMS'. */
  label: string;
  type: string;
  respondingPerson: string | null;
  /** ISO-8601, or null where the source reads 'N/A'. */
  timeCalled: string | null;
  timeArrived: string | null;
  timeCleared: string | null;
  /** Free-form on the wire: the source only ever shows 'Open'. */
  status: string;
  notes: string | null;
}

/** The Police / Fire / EMS blocks of an incident, which share a shape. */
export interface DispatchResponderInfo {
  /** Officer name, fire engine name, or EMS company — the label varies. */
  name: string | null;
  /** EMS only; null in the Police and Fire blocks. */
  responder: string | null;
  /** ISO-8601. */
  timeCalled: string | null;
  timeArrived: string | null;
}

export interface DispatchParty {
  name: string | null;
  type: string | null;
  organization: string | null;
  streetAddress: string | null;
  phone: string | null;
  email: string | null;
}

export interface DispatchVehicle {
  year: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  licenseNumber: string | null;
}

/**
 * The incident shape *Dispatch reads* — not the canonical Incident model.
 * The Incident module is not built yet; when it lands it owns its own types
 * and this either delegates to them or stays as the narrower projection the
 * dispatch review screen actually needs. Named `DispatchIncident` on purpose,
 * so it can't be mistaken for the real thing.
 */
export interface DispatchIncident {
  id: string;
  /** Display reference, e.g. '#96211407'. Never the id — see the trap table. */
  reference: string;
  /** Accordion label, e.g. 'Incident 1'. */
  label: string;
  createdBy: string;
  priority: DispatchPriority;
  incidentType: string;
  /** ISO-8601. */
  occurredAt: string;
  outcome: string;
  notes: string | null;

  // Shown only in the View More Detail sheet.
  ambassador: string | null;
  reportStatus: string;
  supervisorStatus: string;
  address: string;
  describeLocation: string | null;
  latitude: string | null;
  longitude: string | null;
  zone: string | null;
  businessName: string | null;
  fixture: string | null;
  documentCount: number;
  lastModifiedBy: string | null;
  /** ISO-8601. */
  lastModifiedAt: string | null;

  police: DispatchResponderInfo;
  fire: DispatchResponderInfo;
  ems: DispatchResponderInfo;
  clientName: string | null;

  parties: DispatchParty[];
  vehicles: DispatchVehicle[];

  connectedMaintenance: string[];
  connectedPois: string[];
  connectedEquipment: string[];
}

/** What the Add Incident form's dropdowns offer. */
export interface DispatchIncidentFormOptions {
  /** Reserved when the form opens, e.g. '#96211408'. */
  nextReference: string;
  incidentTypes: string[];
  outcomes: string[];
  zones: string[];
  businessNames: string[];
  fixtures: string[];
  partyTypes: string[];
  maintenanceOptions: string[];
  poiOptions: string[];
  equipmentOptions: string[];
}

export interface DispatchIncidentPartyValues {
  name: string;
  type: string;
  organization: string;
  streetAddress: string;
  phone: string;
  email: string;
}

export interface DispatchIncidentVehicleValues {
  year: string;
  make: string;
  model: string;
  color: string;
  licenseNumber: string;
  /**
   * Local URIs from UploadField. Collected because the design shows the
   * control, but dropped at the mapper: DispatchVehicle has no image field and
   * nothing renders one. Revisit when a gateway accepts uploads.
   */
  images: string[];
}

/**
 * The Add Incident form's own shape. Optional values are '' or [] rather than
 * null — a controlled input needs a string — and the mapper converts empties
 * to null on the way into DispatchIncident.
 */
export interface DispatchIncidentFormValues {
  incidentType: string;
  /** ISO-8601, seeded from the device clock. */
  occurredAt: string;
  outcome: string;
  priority: DispatchPriority;

  address: string;
  describeLocation: string;
  zone: string;

  businessName: string;
  description: string;
  documents: string[];
  /** 'Open' | 'In Progress' | 'Completed'. */
  reportStatus: string;
  /** 'In Progress' | 'Completed'. */
  supervisorStatus: string;

  /** Each flag gates whether its block is submitted at all. */
  policeInvolved: boolean;
  policeOfficerName: string;
  policeTimeCalled: string | null;
  policeTimeArrived: string | null;

  fireInvolved: boolean;
  fireEngineName: string;
  fireTimeCalled: string | null;
  fireTimeArrived: string | null;

  emsInvolved: boolean;
  emsCompanyName: string;
  emsResponderName: string;
  emsTimeCalled: string | null;
  emsTimeArrived: string | null;

  clientInvolved: boolean;
  clientName: string;

  parties: DispatchIncidentPartyValues[];
  vehicles: DispatchIncidentVehicleValues[];

  fixture: string;
  connectedMaintenance: string[];
  connectedPois: string[];
  connectedEquipment: string[];
}

/** Everything the detail screen shows beyond the list card. */
export interface DispatchDetail extends Dispatch {
  /** Nullable: detail-only field, absent from the SDL's list selection set. */
  createdBy: string | null;
  sourceNotes: string | null;

  /** Nullable: detail-only field, absent from the SDL's list selection set. */
  location: string | null;
  locationNotes: string | null;

  tagSelected: string | null;
  classificationNotes: string | null;

  assignedRole: string | null;
  assignedIndividual: string | null;
  /** ISO-8601. */
  timeDispatched: string | null;
  timeArrived: string | null;
  timeCleared: string | null;
  initialOutcome: string | null;
  /** 'Yes' | 'No' on the wire; free-form here. */
  fullSquadResponse: string | null;
  outcomeNotes: string | null;

  escalations: DispatchEscalation[];
  incidents: DispatchIncident[];
}
