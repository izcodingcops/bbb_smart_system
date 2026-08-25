export const workLogTypeDefs = /* GraphQL */ `
  enum YesNo {
    YES
    NO
  }

  type WorkLogEntry {
    id: ID!
    "Display reference, a raw 8-digit number, e.g. '#76231707'."
    reference: String!
    shiftTypeId: ID!
    "Denormalized display name at creation time, e.g. 'Cleaning'."
    shiftTypeName: String!
    entryType: String!

    "ISO-8601."
    requestDateTime: String!

    "Cleaning/Management-only — null for every other shift."
    machineNo: String
    fvmAccessibilityChecked: YesNo
    bridgePlateSecured: YesNo
    accessibleFareGateWorking: YesNo
    automaticDoorWorking: YesNo
    fvmNotWorking: YesNo

    "General/Hospitality/Outreach/Safety-only — null for Cleaning/Management."
    description: String

    address: String!
    zone: String
    describeLocation: String!
    businessName: String
    "Zero-padded decimal string, e.g. '01'."
    quantity: String!

    loggedBy: String!
    "ISO-8601."
    createdAt: String!
  }

  type WorkLogFormOptions {
    nextReference: String!
    entryTypes: [String!]!
    zones: [String!]!
    businessNames: [String!]!
  }

  input WorkLogFilter {
    entryTypes: [String!]
    zones: [String!]
    search: String
  }

  input WorkLogInput {
    entryType: String!
    "ISO-8601."
    requestDateTime: String!
    machineNo: String
    fvmAccessibilityChecked: YesNo
    bridgePlateSecured: YesNo
    accessibleFareGateWorking: YesNo
    automaticDoorWorking: YesNo
    fvmNotWorking: YesNo
    description: String
    address: String!
    zone: String
    describeLocation: String
    businessName: String
    quantity: String
    "Only read by createWorkLogEntry — locked after that."
    shiftTypeId: ID
    shiftTypeName: String
  }

  extend type Query {
    workLogEntries(programId: ID!, filter: WorkLogFilter): [WorkLogEntry!]!
    workLogEntry(id: ID!): WorkLogEntry
    workLogFormOptions(programId: ID!, shiftTypeId: ID!): WorkLogFormOptions!
  }

  extend type Mutation {
    createWorkLogEntry(programId: ID!, input: WorkLogInput!): WorkLogEntry!
    updateWorkLogEntry(id: ID!, input: WorkLogInput!): WorkLogEntry!
    deleteWorkLogEntry(id: ID!): ID!
  }
`;
