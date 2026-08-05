import {gql} from '@apollo/client';

export const GET_INCIDENTS = gql`
  query GetIncidents($programId: ID!, $filter: IncidentFilter) {
    incidents(programId: $programId, filter: $filter) {
      id
      reference
      type
      outcome
      priority
      status
      occurredAt
      assignee {
        name
        initials
      }
      person
      businessName
      zone
      address
      queuedOffline
      dispatchReference
    }
  }
`;

export const GET_INCIDENT = gql`
  query GetIncident($id: ID!) {
    incident(id: $id) {
      id
      reference
      type
      outcome
      priority
      status
      occurredAt
      assignee {
        name
        initials
      }
      person
      businessName
      zone
      address
      queuedOffline
      dispatchReference
      ambassador
      createdBy
      supervisorStatus
      lastModifiedBy
      lastModifiedAt
      describeLocation
      latitude
      longitude
      fixture
      description
      documents
      police {
        name
        responder
        timeCalled
        timeArrived
      }
      fire {
        name
        responder
        timeCalled
        timeArrived
      }
      ems {
        name
        responder
        timeCalled
        timeArrived
      }
      clientName
      parties {
        name
        type
        organization
        streetAddress
        phone
        email
      }
      vehicles {
        year
        make
        model
        color
        licenseNumber
      }
      connectedMaintenance
      connectedPois
      connectedEquipment
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

export const GET_INCIDENT_FORM_OPTIONS = gql`
  query GetIncidentFormOptions($programId: ID!) {
    incidentFormOptions(programId: $programId) {
      nextReference
      incidentTypes
      outcomes
      zones
      businessNames
      fixtures
      partyTypes
      maintenanceOptions
      poiOptions
      equipmentOptions
    }
  }
`;

export const SET_INCIDENT_STATUS = gql`
  mutation SetIncidentStatus($id: ID!, $status: IncidentStatus!) {
    setIncidentStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const CREATE_INCIDENT = gql`
  mutation CreateIncident($programId: ID!, $input: IncidentInput!, $dispatchReference: ID) {
    createIncident(programId: $programId, input: $input, dispatchReference: $dispatchReference) {
      id
      reference
    }
  }
`;

export const UPDATE_INCIDENT = gql`
  mutation UpdateIncident($id: ID!, $input: IncidentInput!) {
    updateIncident(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_INCIDENT = gql`
  mutation DeleteIncident($id: ID!) {
    deleteIncident(id: $id)
  }
`;

export const ADD_INCIDENT_COMMENT = gql`
  mutation AddIncidentComment($incidentId: ID!, $text: String!, $images: [String!]) {
    addIncidentComment(incidentId: $incidentId, text: $text, images: $images) {
      id
      createdAt
      text
      edited
      images
    }
  }
`;

export const UPDATE_INCIDENT_COMMENT = gql`
  mutation UpdateIncidentComment($incidentId: ID!, $commentId: ID!, $text: String!, $images: [String!]) {
    updateIncidentComment(incidentId: $incidentId, commentId: $commentId, text: $text, images: $images) {
      id
      createdAt
      text
      edited
      images
    }
  }
`;

export const DELETE_INCIDENT_COMMENT = gql`
  mutation DeleteIncidentComment($incidentId: ID!, $commentId: ID!) {
    deleteIncidentComment(incidentId: $incidentId, commentId: $commentId)
  }
`;
