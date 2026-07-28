export const equipmentTypeDefs = /* GraphQL */ `
  enum EquipmentStatus {
    ACTIVE
    OVERDUE
  }

  type EquipmentItem {
    id: ID!
    "Display asset tag, e.g. '#RDO-4471'."
    assetTag: String!
    name: String!
    category: String!
    "ISO-8601. Formatted for display in the hook."
    checkedInAt: String!
    status: EquipmentStatus!
    icon: String!
    tint: String!
    iconColor: String!
  }

  extend type Query {
    checkedInEquipment(programId: ID!): [EquipmentItem!]!
  }
`;
