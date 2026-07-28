export const maintenanceTypeDefs = /* GraphQL */ `
  enum MaintenanceStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
  }

  type MaintenanceAssignee {
    name: String!
    initials: String!
  }

  type MaintenanceRequest {
    id: ID!
    "Display reference, e.g. '#MT-40877'."
    reference: String!
    type: String!
    status: MaintenanceStatus!
    "ISO-8601."
    requestedAt: String!
    businessName: String!
    priority: Priority!
    assignee: MaintenanceAssignee
    address: String!
    routedToSupervisor: Boolean!
    queuedOffline: Boolean!
  }

  input MaintenanceFilter {
    types: [String!]
    businessNames: [String!]
    priorities: [Priority!]
    statuses: [MaintenanceStatus!]
    queuedOfflineOnly: Boolean
    search: String
  }

  extend type Query {
    maintenanceRequests(
      programId: ID!
      filter: MaintenanceFilter
    ): [MaintenanceRequest!]!
  }
`;
