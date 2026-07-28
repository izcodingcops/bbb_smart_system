export const navigationTypeDefs = /* GraphQL */ `
  enum MenuPosition {
    BOTTOM
    MORE
  }

  enum MenuGroup {
    MODULES
    EMPLOYEE_SHIFT
  }

  type MenuItem {
    id: ID!
    menuName: String!
    screenName: String!
    menuIcon: String!
    position: MenuPosition!
    "Section of the More sheet. Null items fall under MODULES."
    menuGroup: MenuGroup
  }

  extend type Query {
    menuItems(programId: ID): [MenuItem!]!
  }
`;
