export const maintenanceTypeDefs = /* GraphQL */ `
  enum MaintenanceStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
  }

  enum MaintenanceAssigneeKind {
    SUPERVISOR
    DEPARTMENT
    AMBASSADOR
    ME
  }

  type MaintenanceAssignee {
    name: String!
    initials: String!
  }

  type MaintenanceComment {
    id: ID!
    "ISO-8601."
    createdAt: String!
    text: String!
    edited: Boolean!
    "Local file URIs of attached images."
    images: [String!]!
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
    completedBy: String

    "Detail-only fields — null on list queries that don't select them."
    programName: String
    programCode: String
    createdBy: String
    completedOn: String
    paid: Boolean
    assigneeKind: MaintenanceAssigneeKind
    department: String
    zone: String
    describeLocation: String
    description: String
    documents: [String!]
    fixture: String
    incidents: [String!]
    pois: [String!]
    equipment: [String!]
    comments: [MaintenanceComment!]
  }

  type MaintenanceFormOptions {
    nextReference: String!
    types: [String!]!
    zones: [String!]!
    departments: [String!]!
    ambassadors: [String!]!
    businessNames: [String!]!
    fixtures: [String!]!
    incidents: [String!]!
    pois: [String!]!
    equipment: [String!]!
  }

  input MaintenanceFilter {
    types: [String!]
    businessNames: [String!]
    priorities: [Priority!]
    statuses: [MaintenanceStatus!]
    queuedOfflineOnly: Boolean
    search: String
  }

  input MaintenanceRequestInput {
    type: String!
    "ISO-8601."
    requestedAt: String!
    assigneeKind: MaintenanceAssigneeKind!
    department: String
    "Set only when assigneeKind is AMBASSADOR."
    ambassador: String
    priority: Priority!
    address: String!
    zone: String
    describeLocation: String
    businessName: String
    description: String
    documents: [String!]
    fixture: String
    incidents: [String!]
    pois: [String!]
    equipment: [String!]
  }

  extend type Query {
    maintenanceRequests(
      programId: ID!
      filter: MaintenanceFilter
    ): [MaintenanceRequest!]!
    maintenanceRequest(id: ID!): MaintenanceRequest
    maintenanceFormOptions(programId: ID!): MaintenanceFormOptions!
  }

  extend type Mutation {
    setMaintenanceStatus(
      id: ID!
      status: MaintenanceStatus!
    ): MaintenanceRequest!
    assignMaintenanceRequest(
      id: ID!
      assigneeKind: MaintenanceAssigneeKind!
      assigneeName: String
      department: String
    ): MaintenanceRequest!
    createMaintenanceRequest(
      programId: ID!
      input: MaintenanceRequestInput!
    ): MaintenanceRequest!
    updateMaintenanceRequest(
      id: ID!
      input: MaintenanceRequestInput!
    ): MaintenanceRequest!
    deleteMaintenanceRequest(id: ID!): ID!
    addMaintenanceComment(
      requestId: ID!
      text: String!
      images: [String!]
    ): MaintenanceComment!
    updateMaintenanceComment(
      requestId: ID!
      commentId: ID!
      text: String!
      images: [String!]
    ): MaintenanceComment!
    deleteMaintenanceComment(requestId: ID!, commentId: ID!): ID!
  }
`;
