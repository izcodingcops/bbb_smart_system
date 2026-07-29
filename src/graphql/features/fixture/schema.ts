export const fixtureTypeDefs = /* GraphQL */ `
  enum FixtureStatus {
    ACTIVE
    INACTIVE
  }

  type FixtureCreator {
    name: String!
    initials: String!
  }

  type Fixture {
    id: ID!
    "Display reference, e.g. '#FX-42984'."
    reference: String!
    title: String!
    fixtureType: String!
    zone: String!
    status: FixtureStatus!
    createdBy: FixtureCreator!
    queuedOffline: Boolean!
    "ISO-8601."
    createdAt: String!
    address: String!

    "Detail-only fields — null on list queries that don't select them."
    describeLocation: String
    latitude: String
    longitude: String
    description: String
    documents: [String!]
  }

  type FixtureFormOptions {
    nextReference: String!
    fixtureTypes: [String!]!
    zones: [String!]!
  }

  input FixtureFilter {
    fixtureTypes: [String!]
    zones: [String!]
    statuses: [FixtureStatus!]
    queuedOfflineOnly: Boolean
    search: String
  }

  input FixtureInput {
    title: String!
    "ISO-8601."
    serviceDateTime: String!
    fixtureType: String!
    status: FixtureStatus!
    address: String!
    zone: String
    describeLocation: String
    description: String
    documents: [String!]
  }

  extend type Query {
    fixtures(programId: ID!, filter: FixtureFilter): [Fixture!]!
    fixture(id: ID!): Fixture
    fixtureFormOptions(programId: ID!): FixtureFormOptions!
  }

  extend type Mutation {
    setFixtureStatus(id: ID!, status: FixtureStatus!): Fixture!
    createFixture(programId: ID!, input: FixtureInput!): Fixture!
    updateFixture(id: ID!, input: FixtureInput!): Fixture!
    deleteFixture(id: ID!): ID!
  }
`;
