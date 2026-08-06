import {gql} from '@apollo/client';

export const GET_POIS = gql`
  query GetPois($programId: ID!, $filter: PoiFilter) {
    pois(programId: $programId, filter: $filter) {
      id
      reference
      name
      personType
      disposition
      zone
      address
      interactionCount
      createdBy {
        name
        initials
      }
      queuedOffline
      lastModifiedAt
    }
  }
`;

export const GET_POI = gql`
  query GetPoi($id: ID!) {
    poi(id: $id) {
      id
      reference
      name
      personType
      disposition
      zone
      address
      interactionCount
      createdBy {
        name
        initials
      }
      queuedOffline
      lastModifiedAt
      firstSeenAt
      lastModifiedBy
      contact
      top1020
      alias
      gender
      age
      race
      weight
      height
      physicalDescription
      situation
      describeLocation
      contacts {
        name
        email
        phone
        relationship
        notes
      }
      connectedIncidents
      connectedMaintenance
      connectedEquipment
      interactions {
        id
        reference
        interactionType
        occurredAt
        zone
        fixture
        businessLocation
        violation
        note
        documents
      }
      updates {
        id
        reference
        occurredAt
        zone
        description
      }
    }
  }
`;

export const GET_POI_FORM_OPTIONS = gql`
  query GetPoiFormOptions($programId: ID!) {
    poiFormOptions(programId: $programId) {
      nextReference
      personTypes
      dispositions
      genders
      races
      incidentOptions
      maintenanceOptions
      equipmentOptions
    }
  }
`;

export const GET_POI_INTERACTION_FORM_OPTIONS = gql`
  query GetPoiInteractionFormOptions($programId: ID!) {
    poiInteractionFormOptions(programId: $programId) {
      nextReference
      people {
        id
        name
      }
      interactionTypes
      violations
      zones
      fixtures
      businessLocations
    }
  }
`;

export const GET_POI_UPDATE_FORM_OPTIONS = gql`
  query GetPoiUpdateFormOptions($programId: ID!) {
    poiUpdateFormOptions(programId: $programId) {
      nextReference
      people {
        id
        name
      }
      zones
    }
  }
`;

export const CREATE_POI = gql`
  mutation CreatePoi($programId: ID!, $input: PoiInput!) {
    createPoi(programId: $programId, input: $input) {
      id
      reference
    }
  }
`;

export const UPDATE_POI = gql`
  mutation UpdatePoi($id: ID!, $input: PoiInput!) {
    updatePoi(id: $id, input: $input) {
      id
      reference
    }
  }
`;

export const DELETE_POI = gql`
  mutation DeletePoi($id: ID!) {
    deletePoi(id: $id)
  }
`;

export const ADD_POI_INTERACTION = gql`
  mutation AddPoiInteraction($personId: ID!, $input: PoiInteractionInput!) {
    addPoiInteraction(personId: $personId, input: $input) {
      id
      reference
    }
  }
`;

export const ADD_POI_UPDATE = gql`
  mutation AddPoiUpdate($personId: ID!, $input: PoiUpdateInput!) {
    addPoiUpdate(personId: $personId, input: $input) {
      id
      reference
    }
  }
`;
