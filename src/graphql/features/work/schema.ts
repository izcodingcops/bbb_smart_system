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
    assignee: String!
    assigneeInitials: String!
    address: String!
    bucket: WorkBucket!
  }

  type QuickAction {
    id: ID!
    label: String!
    tint: String!
    iconColor: String!
    icon: String!
  }

  extend type Query {
    workItems(programId: ID!, bucket: WorkBucket): [WorkItem!]!
    quickActions(programId: ID!): [QuickAction!]!
  }
`;
