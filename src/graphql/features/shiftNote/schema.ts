export const shiftNoteTypeDefs = /* GraphQL */ `
  "A briefing note pushed to the team before a shift."
  type ShiftNote {
    id: ID!
    "Display reference, e.g. '#SHN-0441'."
    reference: String!
    shiftTypes: [String!]!
    "ISO-8601."
    sentAt: String!
    zone: String!
    "True when the brief went to every ambassador in the zone."
    sendToAll: Boolean!
    "The single recipient. Null whenever sendToAll."
    ambassador: String
    priority: Priority!
    title: String!
    description: String!
    createdBy: String!
  }

  type ShiftNoteFormOptions {
    "Reserved when the form opens, e.g. '#SHN-0442'."
    nextReference: String!
    shiftTypes: [String!]!
    zones: [String!]!
    ambassadors: [String!]!
  }

  input ShiftNoteInput {
    shiftTypes: [String!]!
    "ISO-8601."
    sentAt: String!
    zone: String!
    sendToAll: Boolean!
    "Ignored when sendToAll is true — the note is stored with no named recipient."
    ambassador: String
    priority: Priority!
    title: String!
    description: String!
  }

  extend type Query {
    shiftNoteFormOptions(programId: ID!): ShiftNoteFormOptions!
  }

  # Submit-only: there is no list or detail query, because shared notes are read
  # back on the portal rather than in the app. (A comment rather than a
  # description — type extensions don't accept one.)
  extend type Mutation {
    createShiftNote(programId: ID!, input: ShiftNoteInput!): ShiftNote!
  }
`;
