import {gql} from '@apollo/client';

const AMBASSADOR_FIELDS = `
  id
  reference
  name
  username
  jobTitle
  status
  points
  cases
  rating
  lastLoggedIn
  badges
  totalWork
  totalReports
`;

const WORK_FIELDS = `
  id
  reference
  ambassadorId
  type
  subType
  status
  points
  date
  businessName
  quantity
  zone
  address
  describeLocation
  fixtureType
  fixture
  service
`;

/** Same shape as observationReport's own documents.ts — this module reuses the type verbatim. */
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

export const GET_AMBASSADORS = gql`
  query GetAmbassadors {
    ambassadors { ${AMBASSADOR_FIELDS} }
  }
`;

export const GET_AMBASSADOR = gql`
  query GetAmbassador($id: ID!) {
    ambassador(id: $id) { ${AMBASSADOR_FIELDS} }
  }
`;

export const GET_AMBASSADOR_WORK = gql`
  query GetAmbassadorWork($ambassadorId: ID!) {
    ambassadorWork(ambassadorId: $ambassadorId) { ${WORK_FIELDS} }
  }
`;

export const GET_AMBASSADOR_WORK_ITEM = gql`
  query GetAmbassadorWorkItem($id: ID!) {
    ambassadorWorkItem(id: $id) { ${WORK_FIELDS} }
  }
`;

export const GET_AMBASSADOR_REPORTS = gql`
  query GetAmbassadorReports($ambassadorId: ID!) {
    ambassadorReports(ambassadorId: $ambassadorId) { ${REPORT_FIELDS} }
  }
`;
