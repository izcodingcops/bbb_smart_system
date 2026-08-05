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
    "Resolver-computed — see the dispatch resolver's join against the incident store."
    incidents: [Incident!]
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
