import {gql} from '@apollo/client';

export const GET_REFERENCE_DOCUMENTS = gql`
  query GetReferenceDocuments($programId: ID!) {
    referenceDocuments(programId: $programId) {
      id
      reference
      entryType
      business
      quantity
      zone
      dateTime
      describe
      fixtureType
      fixture
      service
      assignedTo
      createdBy
      address
    }
  }
`;

export const GET_REFERENCE_DOCUMENT = gql`
  query GetReferenceDocument($id: ID!) {
    referenceDocument(id: $id) {
      id
      reference
      entryType
      business
      quantity
      zone
      dateTime
      describe
      fixtureType
      fixture
      service
      assignedTo
      createdBy
      address
    }
  }
`;
