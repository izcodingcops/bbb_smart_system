export const workTypeDefs = /* GraphQL */ `
  enum WorkStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
  }

  enum WorkBucket {
    ASSIGNED
    UNASSIGNED
    COMPLETED
  }

  type WorkItem {
    id: ID!
    "Display ticket number, e.g. '#96211407'."
    ticketNumber: String!
    category: String!
    status: WorkStatus!
    "ISO-8601."
    occurredAt: String!
    type: String!
    priority: Priority!
    zone: String!
    assignee: String!
    assigneeInitials: String!
    address: String!
    bucket: WorkBucket!
    "Completed-card detail fields; which apply depends on category."
    outcome: String
    interaction: String
    disposition: String
    businessName: String
    quantity: String
    "Who created/sent the request — populated for Maintenance only."
    createdBy: String
  }

  type QuickAction {
    id: ID!
    label: String!
    tint: String!
    iconColor: String!
    icon: String!
  }

  extend type Query {
    workItems(programId: ID!): [WorkItem!]!
    quickActions(programId: ID!): [QuickAction!]!
  }

  extend type Mutation {
    setWorkItemStatus(id: ID!, status: WorkStatus!): WorkItem!
  }
`;
