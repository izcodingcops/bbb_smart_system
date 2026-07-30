export const dispatchTypeDefs = /* GraphQL */ `
  enum DispatchStatus {
    OPEN
    ESCALATED
    CLOSED
  }

  enum DispatchPriority {
    LOW
    MEDIUM
    HIGH
  }

  type DispatchEscalation {
    id: ID!
    "Header label, e.g. 'EMS'."
    label: String!
    type: String!
    respondingPerson: String
    "ISO-8601."
    timeCalled: String
    timeArrived: String
    timeCleared: String
    status: String!
    notes: String
  }

  "The Police / Fire / EMS blocks of an incident, which share a shape."
  type DispatchResponderInfo {
    "Officer name, fire engine name, or EMS company — the label varies."
    name: String
    "EMS only."
    responder: String
    "ISO-8601."
    timeCalled: String
    timeArrived: String
  }

  type DispatchParty {
    name: String
    type: String
    organization: String
    streetAddress: String
    phone: String
    email: String
  }

  type DispatchVehicle {
    year: String
    make: String
    model: String
    color: String
    licenseNumber: String
  }

  "What Dispatch reads about a connected incident. Not the canonical Incident type."
  type DispatchIncident {
    id: ID!
    label: String!
    createdBy: String!
    priority: DispatchPriority!
    incidentType: String!
    "ISO-8601."
    occurredAt: String!
    outcome: String!
    notes: String

    ambassador: String
    reportStatus: String!
    supervisorStatus: String!
    address: String!
    describeLocation: String
    latitude: String
    longitude: String
    zone: String
    businessName: String
    fixture: String
    documentCount: Int!
    lastModifiedBy: String
    "ISO-8601."
    lastModifiedAt: String

    police: DispatchResponderInfo!
    fire: DispatchResponderInfo!
    ems: DispatchResponderInfo!
    clientName: String

    parties: [DispatchParty!]!
    vehicles: [DispatchVehicle!]!

    connectedMaintenance: [String!]!
    connectedPois: [String!]!
    connectedEquipment: [String!]!
  }

  type Dispatch {
    id: ID!
    "Display reference, e.g. '#BBB-D 0000-06'."
    reference: String!
    typeOfActivity: String!
    howReferred: String!
    status: DispatchStatus!
    priority: DispatchPriority!
    "ISO-8601."
    createdAt: String!
    address: String!

    "Detail-only fields — null on list queries that don't select them."
    createdBy: String
    sourceNotes: String
    location: String
    locationNotes: String
    tagSelected: String
    classificationNotes: String
    assignedRole: String
    assignedIndividual: String
    timeDispatched: String
    timeArrived: String
    timeCleared: String
    initialOutcome: String
    fullSquadResponse: String
    outcomeNotes: String
    escalations: [DispatchEscalation!]
    incidents: [DispatchIncident!]
  }

  input DispatchFilter {
    statuses: [DispatchStatus!]
    priorities: [DispatchPriority!]
    referralSources: [String!]
    search: String
  }

  extend type Query {
    dispatches(programId: ID!, filter: DispatchFilter): [Dispatch!]!
    dispatch(id: ID!): Dispatch
  }
`;
