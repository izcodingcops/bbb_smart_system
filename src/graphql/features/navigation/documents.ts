import {gql} from '@apollo/client';

export const GET_MENU_ITEMS = gql`
  query GetMenuItems($programId: ID) {
    menuItems(programId: $programId) {
      id
      menuName
      screenName
      menuIcon
      position
      menuGroup
    }
  }
`;
