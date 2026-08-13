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

const EQUIPMENT_DETAIL_FIELDS = `
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
`;

export const GET_EQUIPMENT_DETAIL = gql`
  query GetEquipmentDetail($id: ID!) {
    equipmentDetail(id: $id) {
      ${EQUIPMENT_DETAIL_FIELDS}
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

export const GET_EQUIPMENT_FORM_OPTIONS = gql`
  query GetEquipmentFormOptions {
    equipmentFormOptions {
      upkeepTypes
      abnormalities
      zones
    }
  }
`;

export const CHECK_OUT_EQUIPMENT = gql`
  mutation CheckOutEquipment($input: CheckOutEquipmentInput!) {
    checkOutEquipment(input: $input) {
      ${EQUIPMENT_DETAIL_FIELDS}
    }
  }
`;

export const CHECK_IN_EQUIPMENT = gql`
  mutation CheckInEquipment($input: CheckInEquipmentInput!) {
    checkInEquipment(input: $input) {
      ${EQUIPMENT_DETAIL_FIELDS}
    }
  }
`;

export const ADD_EQUIPMENT_UPKEEP = gql`
  mutation AddEquipmentUpkeep($input: AddEquipmentUpkeepInput!) {
    addEquipmentUpkeep(input: $input) {
      ${EQUIPMENT_DETAIL_FIELDS}
    }
  }
`;
