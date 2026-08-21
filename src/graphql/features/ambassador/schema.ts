export const ambassadorTypeDefs = /* GraphQL */ `
  enum AmbassadorStatus {
    ACTIVE
    IN_ACTIVE
    SUSPENDED
  }

  type Ambassador {
    id: ID!
    "Display reference, e.g. '#27617'."
    reference: String!
    name: String!
    username: String!
    jobTitle: String!
    status: AmbassadorStatus!
    points: Int!
    cases: Int!
    "0 means not rated yet."
    rating: Float!
    "ISO-8601 datetime."
    lastLoggedIn: String!
    badges: [String!]!
    "Recomputed from AmbassadorWork on every read, never stored."
    totalWork: Int!
    "Recomputed from ObservationReport on every read, never stored."
    totalReports: Int!
  }

  enum AmbassadorWorkType {
    CLEANING
    MAINTENANCE
  }

  enum AmbassadorWorkStatus {
    COMPLETED
    IN_PROGRESS
    OPEN
  }

  type AmbassadorWork {
    id: ID!
    "Display reference, e.g. '#107799672'."
    reference: String!
    ambassadorId: ID!
    type: AmbassadorWorkType!
    "'Sub-Type' on a Cleaning card, 'Type' on a Maintenance card."
    subType: String!
    status: AmbassadorWorkStatus!
    "Cleaning-only; a Maintenance card's priority is derived from this instead."
    points: Int!
    "ISO-8601 datetime."
    date: String!
    businessName: String!
    quantity: String!
    zone: String!
    address: String!
    describeLocation: String!
    fixtureType: String
    fixture: String
    service: String!
  }

  extend type Query {
    ambassadors: [Ambassador!]!
    ambassador(id: ID!): Ambassador
    ambassadorWork(ambassadorId: ID!): [AmbassadorWork!]!
    ambassadorWorkItem(id: ID!): AmbassadorWork
    "Reuses ObservationReport verbatim — this module never has its own copy of a report."
    ambassadorReports(ambassadorId: ID!): [ObservationReport!]!
  }
`;
