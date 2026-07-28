import {gql} from '@apollo/client';

const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    username
    email
    avatar
    enableShiftEntry
    programs {
      id
      name
      address
    }
  }
`;

export const LOGIN = gql`
  ${USER_FIELDS}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      __typename
      ... on AuthSession {
        token
        user {
          ...UserFields
        }
        shiftTypes {
          id
          name
          icon
        }
      }
      ... on InvalidCredentials {
        message
      }
    }
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      __typename
      ... on PasswordResetRequested {
        email
      }
      ... on AccountNotFound {
        message
      }
    }
  }
`;

export const VERIFY_RESET_CODE = gql`
  mutation VerifyResetCode($email: String!, $code: String!) {
    verifyResetCode(email: $email, code: $code) {
      __typename
      ... on ResetCodeVerified {
        email
      }
      ... on InvalidResetCode {
        message
      }
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      __typename
      ... on PasswordChanged {
        email
      }
      ... on InvalidResetCode {
        message
      }
      ... on AccountNotFound {
        message
      }
    }
  }
`;
