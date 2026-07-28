import {MOCK_SHIFT_TYPES, MOCK_USERS} from '../../../mocks';
import {MockUser} from '../../../mocks/users';
import {issueToken, MockContext, sleep, userIdForToken} from '../../mockSession';

/** Fixed code the mock treats as the "sent" OTP so the flow is testable. */
const MOCK_RESET_CODE = '111111';

/** The one place legacy snake_case dies. */
function toUser(user: MockUser) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    enableShiftEntry: user.enable_shift_entry,
    programs: user.programs,
  };
}

const findByEmail = (email: string) =>
  MOCK_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

export const authResolvers = {
  Query: {
    me: async (_p: unknown, _a: unknown, ctx: MockContext) => {
      await sleep(150);
      const user = MOCK_USERS.find(u => u.id === userIdForToken(ctx.token));
      return user ? toUser(user) : null;
    },
  },

  Mutation: {
    login: async (
      _p: unknown,
      {input}: {input: {username: string; password: string; loginType: number}},
    ) => {
      await sleep(800);
      const match = MOCK_USERS.find(
        u => u.username === input.username && u.password === input.password,
      );
      if (!match) {
        return {
          __typename: 'InvalidCredentials',
          message: 'Invalid username or password.',
        };
      }
      return {
        __typename: 'AuthSession',
        token: issueToken(match.id),
        user: toUser(match),
        shiftTypes: MOCK_SHIFT_TYPES,
      };
    },

    requestPasswordReset: async (_p: unknown, {email}: {email: string}) => {
      await sleep(800);
      if (!findByEmail(email)) {
        return {
          __typename: 'AccountNotFound',
          message: 'No account is registered with this email.',
        };
      }
      return {__typename: 'PasswordResetRequested', email};
    },

    verifyResetCode: async (
      _p: unknown,
      {email, code}: {email: string; code: string},
    ) => {
      await sleep(800);
      if (code !== MOCK_RESET_CODE) {
        return {
          __typename: 'InvalidResetCode',
          message: 'That code is incorrect. Please check and try again.',
        };
      }
      return {__typename: 'ResetCodeVerified', email};
    },

    resetPassword: async (
      _p: unknown,
      {input}: {input: {email: string; code: string; newPassword: string}},
    ) => {
      await sleep(800);
      if (input.code !== MOCK_RESET_CODE) {
        return {__typename: 'InvalidResetCode', message: 'Verification failed.'};
      }
      const match = findByEmail(input.email);
      if (!match) {
        return {
          __typename: 'AccountNotFound',
          message: 'No account is registered with this email.',
        };
      }
      // Persist for the session so the new password works at login.
      match.password = input.newPassword;
      return {__typename: 'PasswordChanged', email: match.email};
    },
  },

  // graphql-js needs to know which union member a plain object is. Every mock
  // result carries __typename, so this one resolver covers all four unions.
  LoginResult: {__resolveType: (o: {__typename: string}) => o.__typename},
  RequestPasswordResetResult: {__resolveType: (o: {__typename: string}) => o.__typename},
  VerifyResetCodeResult: {__resolveType: (o: {__typename: string}) => o.__typename},
  ResetPasswordResult: {__resolveType: (o: {__typename: string}) => o.__typename},
};
