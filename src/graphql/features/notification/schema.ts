export const notificationTypeDefs = /* GraphQL */ `
  "Which module the activity came from — drives the row's badge, not its route."
  enum NotificationModule {
    MAINTENANCE
    INCIDENT
    FIXTURE
    EQUIPMENT
    CLEANING
    POI
    SYSTEM
  }

  "Record types the app can open a detail screen for."
  enum NotificationRecordType {
    MAINTENANCE
    INCIDENT
    FIXTURE
    POI
    WORK_LOG
  }

  "Overrides the module's default icon for one-off events like a sync."
  enum NotificationIcon {
    SYNC
    COMMENT
    CLOCK
    BELL
  }

  type NotificationTarget {
    recordType: NotificationRecordType!
    "Opaque id for the owning module's detail query — never displayed."
    recordId: ID!
    "Display reference, e.g. '#MT-40877'."
    reference: String!
    title: String!
  }

  type Notification {
    id: ID!
    module: NotificationModule!
    title: String!
    "Bold runs delimited by '**'."
    message: String!
    icon: NotificationIcon
    "ISO-8601."
    createdAt: String!
    unread: Boolean!
    "Null when there is no record to open — System, and Equipment for now."
    related: NotificationTarget
  }

  extend type Query {
    notifications(programId: ID!): [Notification!]!
    unreadNotificationCount(programId: ID!): Int!
  }

  extend type Mutation {
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead(programId: ID!): [Notification!]!
  }
`;
