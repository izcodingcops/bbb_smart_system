import {gql} from '@apollo/client';

export const GET_WORK_LOG_ENTRIES = gql`
  query GetWorkLogEntries($programId: ID!, $filter: WorkLogFilter) {
    workLogEntries(programId: $programId, filter: $filter) {
      id
      reference
      shiftTypeId
      shiftTypeName
      entryType
      machineNo
      requestDateTime
      fvmAccessibilityChecked
      bridgePlateSecured
      accessibleFareGateWorking
      automaticDoorWorking
      fvmNotWorking
      address
      zone
      describeLocation
      businessName
      quantity
      loggedBy
      createdAt
    }
  }
`;

export const GET_WORK_LOG_ENTRY = gql`
  query GetWorkLogEntry($id: ID!) {
    workLogEntry(id: $id) {
      id
      reference
      shiftTypeId
      shiftTypeName
      entryType
      machineNo
      requestDateTime
      fvmAccessibilityChecked
      bridgePlateSecured
      accessibleFareGateWorking
      automaticDoorWorking
      fvmNotWorking
      address
      zone
      describeLocation
      businessName
      quantity
      loggedBy
      createdAt
    }
  }
`;

export const GET_WORK_LOG_FORM_OPTIONS = gql`
  query GetWorkLogFormOptions($programId: ID!, $shiftTypeId: ID!) {
    workLogFormOptions(programId: $programId, shiftTypeId: $shiftTypeId) {
      nextReference
      entryTypes
      zones
      businessNames
    }
  }
`;

export const CREATE_WORK_LOG_ENTRY = gql`
  mutation CreateWorkLogEntry($programId: ID!, $input: WorkLogInput!) {
    createWorkLogEntry(programId: $programId, input: $input) {
      id
      reference
    }
  }
`;

export const UPDATE_WORK_LOG_ENTRY = gql`
  mutation UpdateWorkLogEntry($id: ID!, $input: WorkLogInput!) {
    updateWorkLogEntry(id: $id, input: $input) {
      id
      reference
    }
  }
`;

export const DELETE_WORK_LOG_ENTRY = gql`
  mutation DeleteWorkLogEntry($id: ID!) {
    deleteWorkLogEntry(id: $id)
  }
`;
