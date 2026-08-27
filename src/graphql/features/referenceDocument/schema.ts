export const referenceDocumentTypeDefs = /* GraphQL */ `
  type ReferenceDocument {
    id: ID!
    "Display reference, e.g. '#107799687'."
    reference: String!
    entryType: String!
    business: String!
    quantity: String!
    zone: String!
    "ISO-8601 datetime."
    dateTime: String!
    describe: String!
    fixtureType: String
    fixture: String
    service: String!
    assignedTo: String!
    createdBy: String!
    address: String!
  }

  """
  Serves the list filter sheet only — this module has no create form, so
  unlike every other module's '<Name>FormOptions', there's no form to name
  this after.
  """
  type ReferenceDocumentFilterOptions {
    entryTypes: [String!]!
    businesses: [String!]!
    zones: [String!]!
  }

  extend type Query {
    referenceDocuments(programId: ID!): [ReferenceDocument!]!
    referenceDocument(id: ID!): ReferenceDocument
    referenceDocumentFilterOptions(programId: ID!): ReferenceDocumentFilterOptions!
  }
`;
