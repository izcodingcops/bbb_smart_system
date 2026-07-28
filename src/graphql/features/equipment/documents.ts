import {gql} from '@apollo/client';

export const GET_CHECKED_IN_EQUIPMENT = gql`
  query GetCheckedInEquipment($programId: ID!) {
    checkedInEquipment(programId: $programId) {
      id
      assetTag
      name
      category
      checkedInAt
      status
      icon
      tint
      iconColor
    }
  }
`;
