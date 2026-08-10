import {gql} from '@apollo/client';

export const GET_OBSERVATION_REPORTS = gql`
  query GetObservationReports($programId: ID!) {
    observationReports(programId: $programId) {
      id
      reference
      type
      name
      date
      dateTime
      reviewedBy {
        name
      }
      zone
      score
      summary
      checklist {
        question
        answer
        note
      }
    }
  }
`;

export const GET_OBSERVATION_REPORT = gql`
  query GetObservationReport($id: ID!) {
    observationReport(id: $id) {
      id
      reference
      type
      name
      date
      dateTime
      reviewedBy {
        name
      }
      zone
      score
      summary
      checklist {
        question
        answer
        note
      }
    }
  }
`;
