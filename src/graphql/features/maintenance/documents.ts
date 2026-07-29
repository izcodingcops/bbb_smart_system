import {gql} from '@apollo/client';

export const GET_MAINTENANCE_REQUESTS = gql`
  query GetMaintenanceRequests($programId: ID!, $filter: MaintenanceFilter) {
    maintenanceRequests(programId: $programId, filter: $filter) {
      id
      reference
      type
      status
      requestedAt
      businessName
      priority
      assignee {
        name
        initials
      }
      address
      routedToSupervisor
      queuedOffline
      completedBy
    }
  }
`;

export const GET_MAINTENANCE_REQUEST = gql`
  query GetMaintenanceRequest($id: ID!) {
    maintenanceRequest(id: $id) {
      id
      reference
      type
      status
      requestedAt
      businessName
      priority
      assignee {
        name
        initials
      }
      address
      routedToSupervisor
      queuedOffline
      completedBy
      ambassador
      programName
      programCode
      createdBy
      completedOn
      paid
      assigneeKind
      department
      zone
      describeLocation
      description
      documents
      fixture
      incidents
      pois
      equipment
      comments {
        id
        createdAt
        text
        edited
        images
      }
    }
  }
`;

export const GET_MAINTENANCE_FORM_OPTIONS = gql`
  query GetMaintenanceFormOptions($programId: ID!) {
    maintenanceFormOptions(programId: $programId) {
      nextReference
      types
      zones
      departments
      businessNames
      fixtures
      incidents
      pois
      equipment
      fixtureTypes
    }
  }
`;

export const SET_MAINTENANCE_STATUS = gql`
  mutation SetMaintenanceStatus($id: ID!, $status: MaintenanceStatus!) {
    setMaintenanceStatus(id: $id, status: $status) {
      id
      status
      completedBy
      completedOn
    }
  }
`;

export const CREATE_MAINTENANCE_REQUEST = gql`
  mutation CreateMaintenanceRequest(
    $programId: ID!
    $input: MaintenanceRequestInput!
  ) {
    createMaintenanceRequest(programId: $programId, input: $input) {
      id
      reference
    }
  }
`;

export const UPDATE_MAINTENANCE_REQUEST = gql`
  mutation UpdateMaintenanceRequest(
    $id: ID!
    $input: MaintenanceRequestInput!
  ) {
    updateMaintenanceRequest(id: $id, input: $input) {
      id
      reference
    }
  }
`;

export const DELETE_MAINTENANCE_REQUEST = gql`
  mutation DeleteMaintenanceRequest($id: ID!) {
    deleteMaintenanceRequest(id: $id)
  }
`;

export const ADD_MAINTENANCE_COMMENT = gql`
  mutation AddMaintenanceComment(
    $requestId: ID!
    $text: String!
    $images: [String!]
  ) {
    addMaintenanceComment(requestId: $requestId, text: $text, images: $images) {
      id
    }
  }
`;

export const UPDATE_MAINTENANCE_COMMENT = gql`
  mutation UpdateMaintenanceComment(
    $requestId: ID!
    $commentId: ID!
    $text: String!
    $images: [String!]
  ) {
    updateMaintenanceComment(
      requestId: $requestId
      commentId: $commentId
      text: $text
      images: $images
    ) {
      id
    }
  }
`;

export const DELETE_MAINTENANCE_COMMENT = gql`
  mutation DeleteMaintenanceComment($requestId: ID!, $commentId: ID!) {
    deleteMaintenanceComment(requestId: $requestId, commentId: $commentId)
  }
`;

export const CREATE_MAINTENANCE_FIXTURE = gql`
  mutation CreateMaintenanceFixture($name: String!, $fixtureType: String!) {
    createMaintenanceFixture(name: $name, fixtureType: $fixtureType)
  }
`;
