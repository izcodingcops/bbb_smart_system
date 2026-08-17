import {gql} from '@apollo/client';

/**
 * Operation names matter beyond debugging here — slice 2's mutations name them
 * in `refetchQueries`.
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

export const GET_RVP_SITE_VISIT = gql`
  query GetRvpSiteVisit($id: ID!) {
    rvpSiteVisit(id: $id) {
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
    }
  }
`;
