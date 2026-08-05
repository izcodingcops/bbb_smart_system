import {gql} from '@apollo/client';

export const GET_DISPATCHES = gql`
  query GetDispatches($programId: ID!, $filter: DispatchFilter) {
    dispatches(programId: $programId, filter: $filter) {
      id
      reference
      typeOfActivity
      howReferred
      status
      priority
      createdAt
      address
    }
  }
`;

export const GET_DISPATCH = gql`
  query GetDispatch($id: ID!) {
    dispatch(id: $id) {
      id
      reference
      typeOfActivity
      howReferred
      status
      priority
      createdAt
      address
      createdBy
      sourceNotes
      location
      locationNotes
      tagSelected
      classificationNotes
      assignedRole
      assignedIndividual
      timeDispatched
      timeArrived
      timeCleared
      initialOutcome
      fullSquadResponse
      outcomeNotes
      escalations {
        id
        label
        type
        respondingPerson
        timeCalled
        timeArrived
        timeCleared
        status
        notes
      }
      incidents {
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
  }
`;
