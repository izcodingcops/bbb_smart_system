export const authTypeDefs = /* GraphQL */ `
  type Program {
    id: ID!
    name: String!
    address: String!
  }

  type ShiftType {
    id: ID!
    name: String!
    icon: String!
  }

  type User {
    id: ID!
    name: String!
    username: String!
    email: String
    avatar: String
    enableShiftEntry: Boolean!
    programs: [Program!]!
  }

  type AuthSession {
    token: String!
    user: User!
    shiftTypes: [ShiftType!]!
  }

  "Expected outcomes. These are data, not transport errors."
  type InvalidCredentials {
    message: String!
  }
  type AccountNotFound {
    message: String!
  }
  type InvalidResetCode {
    message: String!
  }
  type PasswordResetRequested {
    email: String!
  }
  type ResetCodeVerified {
    email: String!
  }
  type PasswordChanged {
    email: String!
  }

  union LoginResult = AuthSession | InvalidCredentials
  union RequestPasswordResetResult = PasswordResetRequested | AccountNotFound
  union VerifyResetCodeResult = ResetCodeVerified | InvalidResetCode
  union ResetPasswordResult = PasswordChanged | InvalidResetCode | AccountNotFound

  input LoginInput {
    username: String!
    password: String!
    loginType: Int!
  }

  input ResetPasswordInput {
    email: String!
    code: String!
    newPassword: String!
  }

  extend type Query {
    "Resolved from the bearer token; null when unauthenticated."
    me: User
  }

  extend type Mutation {
    login(input: LoginInput!): LoginResult!
    requestPasswordReset(email: String!): RequestPasswordResetResult!
    verifyResetCode(email: String!, code: String!): VerifyResetCodeResult!
    resetPassword(input: ResetPasswordInput!): ResetPasswordResult!
  }
`;
