import {gql} from '@apollo/client';

export const GET_FIXTURES = gql`
  query GetFixtures($programId: ID!, $filter: FixtureFilter) {
    fixtures(programId: $programId, filter: $filter) {
      id
      reference
      title
      fixtureType
      zone
      status
      createdBy {
        name
        initials
      }
      queuedOffline
      createdAt
      address
    }
  }
`;

export const GET_FIXTURE = gql`
  query GetFixture($id: ID!) {
    fixture(id: $id) {
      id
      reference
      title
      fixtureType
      zone
      status
      createdBy {
        name
        initials
      }
      queuedOffline
      createdAt
      address
      describeLocation
      latitude
      longitude
      description
      documents
    }
  }
`;

export const GET_FIXTURE_FORM_OPTIONS = gql`
  query GetFixtureFormOptions($programId: ID!) {
    fixtureFormOptions(programId: $programId) {
      nextReference
      fixtureTypes
      zones
    }
  }
`;

export const SET_FIXTURE_STATUS = gql`
  mutation SetFixtureStatus($id: ID!, $status: FixtureStatus!) {
    setFixtureStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const CREATE_FIXTURE = gql`
  mutation CreateFixture($programId: ID!, $input: FixtureInput!) {
    createFixture(programId: $programId, input: $input) {
      id
      reference
    }
  }
`;

export const UPDATE_FIXTURE = gql`
  mutation UpdateFixture($id: ID!, $input: FixtureInput!) {
    updateFixture(id: $id, input: $input) {
      id
      reference
    }
  }
`;

export const DELETE_FIXTURE = gql`
  mutation DeleteFixture($id: ID!) {
    deleteFixture(id: $id)
  }
`;
