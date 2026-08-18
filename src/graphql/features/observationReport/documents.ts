import {gql} from '@apollo/client';

/**
 * Shared by the list query, the detail query and both write mutations, which
 * all return this same `ObservationReport` shape — unlike RVP, there is no
 * separate list-summary type, since even the full checklist is only 5 items.
 */
const REPORT_FIELDS = `
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
  images
`;

export const GET_OBSERVATION_REPORTS = gql`
  query GetObservationReports($programId: ID!) {
    observationReports(programId: $programId) { ${REPORT_FIELDS} }
  }
`;

export const GET_OBSERVATION_REPORT = gql`
  query GetObservationReport($id: ID!) {
    observationReport(id: $id) { ${REPORT_FIELDS} }
  }
`;

export const GET_OBSERVATION_REPORT_FORM_OPTIONS = gql`
  query GetObservationReportFormOptions($programId: ID!) {
    observationReportFormOptions(programId: $programId) {
      nextReference
      zones
      ambassadors
      supervisors
      questions {
        key
        prompt
      }
    }
  }
`;

export const CREATE_OBSERVATION_REPORT = gql`
  mutation CreateObservationReport($programId: ID!, $input: ObservationReportInput!) {
    createObservationReport(programId: $programId, input: $input) { ${REPORT_FIELDS} }
  }
`;

export const UPDATE_OBSERVATION_REPORT = gql`
  mutation UpdateObservationReport($id: ID!, $input: ObservationReportInput!) {
    updateObservationReport(id: $id, input: $input) { ${REPORT_FIELDS} }
  }
`;

export const DELETE_OBSERVATION_REPORT = gql`
  mutation DeleteObservationReport($id: ID!) {
    deleteObservationReport(id: $id)
  }
`;
