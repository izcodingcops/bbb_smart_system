export const poiTypeDefs = /* GraphQL */ `
  enum PoiDisposition {
    ACTIVE
    DECEASED
    HOUSED
    IN_ACTIVE
    INCARCERATED
    TRANSITIONAL_CARE
  }

  type PoiCreator {
    name: String!
    initials: String!
  }

  type PoiContact {
    name: String!
    email: String!
    phone: String!
    relationship: String!
    notes: String!
  }

  "Append-only — there is no update or delete mutation for these."
  type PoiInteraction {
    id: ID!
    "Display reference, e.g. '#INT-9007'."
    reference: String!
    interactionType: String!
    "ISO-8601."
    occurredAt: String!
    zone: String!
    fixture: String
    businessLocation: String
    violation: String
    note: String
    documents: [String!]!
  }

  "Append-only, like PoiInteraction."
  type PoiUpdate {
    id: ID!
    "Display reference, e.g. '#UPD-3301'."
    reference: String!
    "ISO-8601."
    occurredAt: String!
    zone: String!
    description: String!
  }

  type Poi {
    id: ID!
    "Display reference, e.g. '#POI-4021'."
    reference: String!
    name: String!
    personType: String!
    disposition: PoiDisposition!
    "Stamped at create from device state — the person form never asks for it."
    zone: String!
    address: String!
    "Derived from the timeline, so a list card never has to load one."
    interactionCount: Int!
    createdBy: PoiCreator!
    queuedOffline: Boolean!
    "ISO-8601."
    lastModifiedAt: String!

    "Detail-only fields — null on list queries that don't select them."
    firstSeenAt: String
    lastModifiedBy: String
    "Phone number or email — one field, either form."
    contact: String
    top1020: Boolean
    alias: String
    gender: String
    age: String
    race: String
    weight: String
    height: String
    physicalDescription: String
    situation: String
    "Never collected by the form — null on records the app creates."
    describeLocation: String
    contacts: [PoiContact!]
    connectedIncidents: [String!]
    connectedMaintenance: [String!]
    connectedEquipment: [String!]
    interactions: [PoiInteraction!]
    updates: [PoiUpdate!]
  }

  "A person the Interaction and Update pickers point at. A name is not a key."
  type PoiPerson {
    id: ID!
    name: String!
  }

  type PoiFormOptions {
    "Reserved when the form opens, e.g. '#POI-4022'."
    nextReference: String!
    personTypes: [String!]!
    dispositions: [String!]!
    genders: [String!]!
    races: [String!]!
    incidentOptions: [String!]!
    maintenanceOptions: [String!]!
    equipmentOptions: [String!]!
  }

  type PoiInteractionFormOptions {
    nextReference: String!
    people: [PoiPerson!]!
    interactionTypes: [String!]!
    violations: [String!]!
    zones: [String!]!
    fixtures: [String!]!
    businessLocations: [String!]!
  }

  type PoiUpdateFormOptions {
    nextReference: String!
    people: [PoiPerson!]!
    zones: [String!]!
  }

  input PoiFilter {
    personTypes: [String!]
    dispositions: [PoiDisposition!]
    zones: [String!]
    queuedOfflineOnly: Boolean
    search: String
  }

  input PoiContactInput {
    name: String!
    email: String!
    phone: String!
    relationship: String!
    notes: String!
  }

  input PoiInput {
    name: String!
    personType: String!
    disposition: PoiDisposition!
    "ISO-8601."
    occurredAt: String!
    contact: String
    top1020: Boolean!
    alias: String
    gender: String
    age: String
    race: String
    weight: String
    height: String
    physicalDescription: String
    situation: String
    contacts: [PoiContactInput!]!
    connectedIncidents: [String!]!
    connectedMaintenance: [String!]!
    connectedEquipment: [String!]!
  }

  input PoiInteractionInput {
    interactionType: String!
    "ISO-8601."
    occurredAt: String!
    zone: String!
    fixture: String
    businessLocation: String
    violation: String
    note: String
    documents: [String!]!
  }

  input PoiUpdateInput {
    "ISO-8601."
    occurredAt: String!
    zone: String!
    description: String!
  }

  extend type Query {
    pois(programId: ID!, filter: PoiFilter): [Poi!]!
    poi(id: ID!): Poi
    poiFormOptions(programId: ID!): PoiFormOptions!
    poiInteractionFormOptions(programId: ID!): PoiInteractionFormOptions!
    poiUpdateFormOptions(programId: ID!): PoiUpdateFormOptions!
  }

  extend type Mutation {
    createPoi(programId: ID!, input: PoiInput!): Poi!
    updatePoi(id: ID!, input: PoiInput!): Poi!
    deletePoi(id: ID!): ID!
    addPoiInteraction(personId: ID!, input: PoiInteractionInput!): PoiInteraction!
    addPoiUpdate(personId: ID!, input: PoiUpdateInput!): PoiUpdate!
  }
`;
