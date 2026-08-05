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
