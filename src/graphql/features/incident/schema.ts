export const incidentTypeDefs = /* GraphQL */ `
  enum IncidentStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
  }

  type IncidentAssignee {
    name: String!
    initials: String!
  }

  "Police and Fire share this shape; EMS adds \`responder\`."
  type IncidentResponderInfo {
    name: String
    "EMS only."
    responder: String
    "ISO-8601."
    timeCalled: String
    timeArrived: String
  }

  type IncidentParty {
    name: String
    type: String
    organization: String
    streetAddress: String
    phone: String
    email: String
  }

  type IncidentVehicle {
    year: String
    make: String
    model: String
    color: String
    licenseNumber: String
  }

  type IncidentComment {
    id: ID!
    "ISO-8601."
    createdAt: String!
    text: String!
    edited: Boolean!
    images: [String!]!
  }

  type Incident {
    id: ID!
    "Display reference, e.g. '#IN-42984'."
    reference: String!
    type: String!
    outcome: String!
    priority: Priority!
    "Also 'Report Status' on the form — one field."
    status: IncidentStatus!
    "ISO-8601."
    occurredAt: String!
    assignee: IncidentAssignee
    "Filter/search only."
    person: String!
    businessName: String!
    zone: String!
    address: String!
    queuedOffline: Boolean!
    "Set only when created from within a Dispatch call's Add Incident flow."
    dispatchReference: String

    "Detail-only fields — null on list queries that don't select them."
    ambassador: String
    createdBy: String
    supervisorStatus: String
    lastModifiedBy: String
    lastModifiedAt: String
    describeLocation: String
    latitude: String
    longitude: String
    fixture: String
    description: String
    documents: [String!]
    police: IncidentResponderInfo
    fire: IncidentResponderInfo
    ems: IncidentResponderInfo
    clientName: String
    parties: [IncidentParty!]
    vehicles: [IncidentVehicle!]
    connectedMaintenance: [String!]
    connectedPois: [String!]
    connectedEquipment: [String!]
    comments: [IncidentComment!]
  }

  type IncidentFormOptions {
    "Reserved when the form opens, e.g. '#IN-42985'."
    nextReference: String!
    incidentTypes: [String!]!
    outcomes: [String!]!
    zones: [String!]!
    businessNames: [String!]!
    fixtures: [String!]!
    partyTypes: [String!]!
    maintenanceOptions: [String!]!
    poiOptions: [String!]!
    equipmentOptions: [String!]!
  }

  input IncidentFilter {
    types: [String!]
    outcomes: [String!]
    statuses: [IncidentStatus!]
    priorities: [Priority!]
    businessNames: [String!]
    persons: [String!]
    queuedOfflineOnly: Boolean
    search: String
  }

  extend type Query {
    incidents(programId: ID!, filter: IncidentFilter): [Incident!]!
    incident(id: ID!): Incident
    incidentFormOptions(programId: ID!): IncidentFormOptions!
  }
`;
