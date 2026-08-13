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

  extend type Query {
    equipment(programId: ID!): [Equipment!]!
    "Only the records held by the signed-in user. Home reads this one."
    myEquipment(programId: ID!): [Equipment!]!
    equipmentDetail(id: ID!): EquipmentDetail
    "Resolves a scanned QR payload or typed number against serial or reference."
    equipmentByCode(programId: ID!, code: String!): Equipment
  }
`;
