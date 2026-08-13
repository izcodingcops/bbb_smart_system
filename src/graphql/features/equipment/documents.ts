import {gql} from '@apollo/client';

const EQUIPMENT_FIELDS = `
  id
  reference
  serial
  name
  equipmentType
  category
  make
  model
  zone
  program
  region
  division
  status
  createdAt
  acquiredAt
  unit
  beginningUsage
  year
  ownership
  description
  checkedOutBy
  checkedOutAt
  mine
  queuedOffline
`;

export const GET_EQUIPMENT = gql`
  query GetEquipment($programId: ID!) {
    equipment(programId: $programId) {
      ${EQUIPMENT_FIELDS}
    }
  }
`;

export const GET_MY_EQUIPMENT = gql`
  query GetMyEquipment($programId: ID!) {
    myEquipment(programId: $programId) {
      ${EQUIPMENT_FIELDS}
    }
  }
`;

export const GET_EQUIPMENT_DETAIL = gql`
  query GetEquipmentDetail($id: ID!) {
    equipmentDetail(id: $id) {
      ${EQUIPMENT_FIELDS}
      fuel
      images
      upkeeps {
        id
        upkeepType
        occurredAt
        vendor
        cost
        currentUsage
        zone
        description
      }
      incidents
      personsOfInterest
      maintenance
    }
  }
`;

export const GET_EQUIPMENT_BY_CODE = gql`
  query GetEquipmentByCode($programId: ID!, $code: String!) {
    equipmentByCode(programId: $programId, code: $code) {
      ${EQUIPMENT_FIELDS}
    }
  }
`;

/** Legacy — Home's checked-in card. Removed in Task 6. */
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
