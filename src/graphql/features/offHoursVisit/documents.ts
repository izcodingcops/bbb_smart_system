import {gql} from '@apollo/client';

export const GET_OFF_HOURS_VISIT_FORM_OPTIONS = gql`
  query GetOffHoursVisitFormOptions($programId: ID!) {
    offHoursVisitFormOptions(programId: $programId) {
      nextReference
      type
      zones
      questions {
        key
        prompt
        hint
        options {
          label
          points
        }
        reveal
        numeric
      }
    }
  }
`;

export const CREATE_OFF_HOURS_VISIT = gql`
  mutation CreateOffHoursVisit($programId: ID!, $input: OffHoursVisitInput!) {
    createOffHoursVisit(programId: $programId, input: $input) {
      id
      reference
      rating
      ratingMax
    }
  }
`;
