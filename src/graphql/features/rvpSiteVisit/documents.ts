import {gql} from '@apollo/client';

/**
 * Operation names matter beyond debugging here — the mutations name them in
 * `refetchQueries`.
 */
export const GET_RVP_SITE_VISITS = gql`
  query GetRvpSiteVisits($programId: ID!) {
    rvpSiteVisits(programId: $programId) {
      id
      reference
      program
      operationManager
      leaderPosition
      startDate
      endDate
      reviewedBy
      updatedBy
      updatedAt
      score
      scoreMax
      avgScore
      isComplete
    }
  }
`;

/** Shared by the detail query and both mutations, which all return a detail. */
const DETAIL_FIELDS = `
  id
  reference
  program
  operationManager
  leaderPosition
  startDate
  endDate
  reviewedBy
  updatedBy
  updatedAt
  score
  scoreMax
  avgScore
  isComplete
  visitType
  reasonForVisit
  images
  sections {
    key
    title
    subtitle
    score
    scoreMax
    texts {
      label
      value
    }
    groups {
      title
      observedFrom
      observedTo
      howObserved
      notesLabel
      notes
      answers {
        question
        answer
        note
        images
      }
    }
  }
`;

export const GET_RVP_SITE_VISIT = gql`
  query GetRvpSiteVisit($id: ID!) {
    rvpSiteVisit(id: $id) { ${DETAIL_FIELDS} }
  }
`;

export const GET_RVP_SITE_VISIT_FORM_OPTIONS = gql`
  query GetRvpSiteVisitFormOptions($programId: ID!) {
    rvpSiteVisitFormOptions(programId: $programId) {
      nextReference
      programs
      visitTypes
      operationManagers
      sections {
        key
        title
        subtitle
        textPrompts
        groups {
          key
          title
          requiresTime
          requiresHow
          notesLabel
          questions {
            key
            prompt
          }
        }
      }
    }
  }
`;

export const CREATE_RVP_SITE_VISIT = gql`
  mutation CreateRvpSiteVisit($programId: ID!, $input: RvpSiteVisitInput!) {
    createRvpSiteVisit(programId: $programId, input: $input) { ${DETAIL_FIELDS} }
  }
`;

export const UPDATE_RVP_SITE_VISIT = gql`
  mutation UpdateRvpSiteVisit($id: ID!, $input: RvpSiteVisitInput!) {
    updateRvpSiteVisit(id: $id, input: $input) { ${DETAIL_FIELDS} }
  }
`;

export const DELETE_RVP_SITE_VISIT = gql`
  mutation DeleteRvpSiteVisit($id: ID!) {
    deleteRvpSiteVisit(id: $id)
  }
`;
