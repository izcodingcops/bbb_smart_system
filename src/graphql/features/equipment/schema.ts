export const equipmentTypeDefs = /* GraphQL */ `
  enum EquipmentStatus {
    ACTIVE
    CHECKED_OUT
  }

  enum EquipmentOwnership {
    OWNED
    LEASED
    RENTED
    LOANED
  }

  enum EquipmentUnit {
    MILES
    HOURS
    KILOMETERS
    NONE
  }

  type EquipmentUpkeep {
    id: ID!
    upkeepType: String!
    "ISO-8601."
    occurredAt: String!
    vendor: String
    cost: String
    currentUsage: String
    zone: String
    description: String
  }

  type Equipment {
    id: ID!
    "Display reference, e.g. '#4341'. Never used for routing."
    reference: String!
    "Serial / vehicle number, e.g. 'SN-4341-BX'. The card headline and the QR payload."
    serial: String!
    name: String!
    equipmentType: String!
    category: String!
    make: String!
    model: String!
    zone: String!
    program: String!
    region: String!
    division: String!
    status: EquipmentStatus!
    "ISO-8601."
    createdAt: String!
    "ISO-8601."
    acquiredAt: String
    unit: EquipmentUnit!
    beginningUsage: String
    year: String
    ownership: EquipmentOwnership!
    description: String
    "Display name of the holder. Null when ACTIVE."
    checkedOutBy: String
    "ISO-8601."
    checkedOutAt: String
    "True when the holder is the signed-in user."
    mine: Boolean!
    queuedOffline: Boolean!
  }

  type EquipmentDetail {
    id: ID!
    reference: String!
    serial: String!
    name: String!
    equipmentType: String!
    category: String!
    make: String!
    model: String!
    zone: String!
    program: String!
    region: String!
    division: String!
    status: EquipmentStatus!
    createdAt: String!
    acquiredAt: String
    unit: EquipmentUnit!
    beginningUsage: String
    year: String
    ownership: EquipmentOwnership!
    description: String
    checkedOutBy: String
    checkedOutAt: String
    mine: Boolean!
    queuedOffline: Boolean!

    "'Vehicle is on' — Gas | Electricity."
    fuel: String
    images: [String!]!
    "Newest first."
    upkeeps: [EquipmentUpkeep!]!
    incidents: [String!]!
    personsOfInterest: [String!]!
    maintenance: [String!]!
  }

  "Suffixed 'Option' throughout: a bare 'EquipmentType' would read as the record's own equipmentType field."
  type EquipmentMakeOption {
    name: String!
    models: [String!]!
  }

  type EquipmentTypeOption {
    name: String!
    makes: [EquipmentMakeOption!]!
  }

  type EquipmentCategoryOption {
    name: String!
    types: [EquipmentTypeOption!]!
  }

  type EquipmentFormOptions {
    upkeepTypes: [String!]!
    abnormalities: [String!]!
    zones: [String!]!
    regions: [String!]!
    divisions: [String!]!
    "The reference the create form shows before the record exists, e.g. '#4366'."
    nextReference: String!
    "Dependent Category → Type → Make → Model tree."
    categories: [EquipmentCategoryOption!]!
    ownerships: [EquipmentOwnership!]!
    units: [EquipmentUnit!]!
    fuels: [String!]!
    incidents: [String!]!
    personsOfInterest: [String!]!
    maintenance: [String!]!
  }

  input EquipmentInput {
    serial: String!
    name: String!
    "ISO-8601."
    acquiredAt: String!
    category: String!
    equipmentType: String!
    make: String!
    model: String!
    unit: EquipmentUnit!
    ownership: EquipmentOwnership!
    fuel: String
    year: String
    beginningUsage: String
    zone: String
    description: String
    images: [String!]
    incidents: [String!]
    personsOfInterest: [String!]
    maintenance: [String!]
  }

  input CheckOutEquipmentInput {
    id: ID!
    "ISO-8601."
    occurredAt: String!
    hasAbnormality: Boolean!
    abnormality: String
    description: String
    images: [String!]
  }

  input CheckInEquipmentInput {
    id: ID!
    "ISO-8601."
    occurredAt: String!
    currentUsage: String!
    hasAbnormality: Boolean!
    abnormality: String
    description: String
    images: [String!]
  }

  input AddEquipmentUpkeepInput {
    id: ID!
    upkeepType: String!
    "ISO-8601."
    occurredAt: String!
    vendor: String!
    currentUsage: String!
    cost: String!
    zone: String
    description: String
    images: [String!]
  }

  extend type Query {
    equipment(programId: ID!): [Equipment!]!
    "Only the records held by the signed-in user. Home reads this one."
    myEquipment(programId: ID!): [Equipment!]!
    equipmentDetail(id: ID!): EquipmentDetail
    "Resolves a scanned QR payload or typed number against serial or reference."
    equipmentByCode(programId: ID!, code: String!): Equipment
    equipmentFormOptions: EquipmentFormOptions!
  }

  extend type Mutation {
    "programId mirrors createFixture / createPoi — a real gateway scopes the new record by it."
    createEquipment(programId: ID!, input: EquipmentInput!): EquipmentDetail!
    updateEquipment(id: ID!, input: EquipmentInput!): EquipmentDetail!
    "Returns the deleted id."
    deleteEquipment(id: ID!): ID!
    checkOutEquipment(input: CheckOutEquipmentInput!): EquipmentDetail!
    checkInEquipment(input: CheckInEquipmentInput!): EquipmentDetail!
    addEquipmentUpkeep(input: AddEquipmentUpkeepInput!): EquipmentDetail!
  }
`;
