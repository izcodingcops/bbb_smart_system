export type IncidentStatus = 'Open' | 'In-progress' | 'Completed';
export type IncidentPriority = 'Low' | 'Medium' | 'High';

export interface IncidentAssignee {
  name: string;
  initials: string;
}

/** The list card's shape. */
export interface Incident {
  /** Opaque server identifier. Never displayed — use `reference` for that. */
  id: string;
  /** Display reference, e.g. '#IN-42984'. */
  reference: string;
  type: string;
  outcome: string;
  priority: IncidentPriority;
  /** Also "Report Status" in the Other Details form section — one field. */
  status: IncidentStatus;
  /** ISO-8601. */
  occurredAt: string;
  assignee: IncidentAssignee | null;
  /** Filter/search only — not rendered on the card. */
  person: string;
  businessName: string;
  zone: string;
  address: string;
  queuedOffline: boolean;
  /** Set only when created from within a Dispatch call's Add Incident flow. */
  dispatchReference: string | null;
}

/** Police and Fire share this shape; EMS adds `responder`. */
export interface IncidentResponderInfo {
  name: string | null;
  responder: string | null;
  /** ISO-8601. */
  timeCalled: string | null;
  timeArrived: string | null;
}

export interface IncidentParty {
  name: string | null;
  type: string | null;
  organization: string | null;
  streetAddress: string | null;
  phone: string | null;
  email: string | null;
}

export interface IncidentVehicle {
  year: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  licenseNumber: string | null;
}

export interface IncidentComment {
  id: string;
  /** ISO-8601. */
  createdAt: string;
  text: string;
  edited: boolean;
  images: string[];
}

/** Everything the View/Edit screens show beyond the list card. */
export interface IncidentDetail extends Incident {
  /** Who logged it — distinct from `assignee`, who's handling it. */
  ambassador: string | null;
  createdBy: string | null;
  /** 'In Progress' | 'Completed'. */
  supervisorStatus: string;
  lastModifiedBy: string | null;
  /** ISO-8601. */
  lastModifiedAt: string | null;

  describeLocation: string | null;
  latitude: string | null;
  longitude: string | null;

  fixture: string | null;
  description: string | null;
  documents: string[];

  police: IncidentResponderInfo;
  fire: IncidentResponderInfo;
  ems: IncidentResponderInfo;
  clientName: string | null;

  parties: IncidentParty[];
  vehicles: IncidentVehicle[];

  connectedMaintenance: string[];
  connectedPois: string[];
  connectedEquipment: string[];

  comments: IncidentComment[];
}

/** What the Create/Edit form's dropdowns offer. */
export interface IncidentFormOptions {
  /** Reserved when the form opens, e.g. '#IN-42985'. */
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

export interface IncidentPartyValues {
  name: string;
  type: string;
  organization: string;
  streetAddress: string;
  phone: string;
  email: string;
}

export interface IncidentVehicleValues {
  year: string;
  make: string;
  model: string;
  color: string;
  licenseNumber: string;
  /** Local URIs from UploadField. Dropped at the mapper — IncidentVehicle has no image field. */
  images: string[];
}

/**
 * The form's own shape. Optional values are '' or [] rather than null — a
 * controlled input needs a string — and the mapper converts empties to null
 * on the way into IncidentDetail. Never has an assignee field: a new incident
 * always starts unassigned, standalone or from Dispatch alike.
 */
export interface IncidentFormValues {
  incidentType: string;
  /** ISO-8601, seeded from the device clock. */
  occurredAt: string;
  outcome: string;
  priority: IncidentPriority;

  address: string;
  describeLocation: string;
  zone: string;

  businessName: string;
  description: string;
  documents: string[];
  /** 'Open' | 'In Progress' | 'Completed' — becomes `status` on the way in. */
  reportStatus: string;
  /** 'In Progress' | 'Completed'. */
  supervisorStatus: string;

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

  parties: IncidentPartyValues[];
  vehicles: IncidentVehicleValues[];

  fixture: string;
  connectedMaintenance: string[];
  connectedPois: string[];
  connectedEquipment: string[];
}
