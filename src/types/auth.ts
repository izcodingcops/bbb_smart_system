import {Program, ShiftType} from './shift';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  enableShiftEntry?: boolean;
}

export interface Session {
  token: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  programs: Program[];
  activeProgramId: string | null;
  shiftTypes: ShiftType[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
  login_type: number;
}

/* ---------- GraphQL result types ----------
 * Mirror the unions in src/graphql/features/auth/schema.ts one-for-one.
 * Hand-written only until the gateway ships an SDL; graphql-codegen then emits
 * exactly these and this block is deleted. Note the absence of `status`.
 */
export interface GqlUser {
  id: string;
  name: string;
  username: string;
  email: string | null;
  avatar: string | null;
  enableShiftEntry: boolean;
  programs: Program[];
}

export interface AuthSession {
  __typename: 'AuthSession';
  token: string;
  user: GqlUser;
  shiftTypes: ShiftType[];
}
export interface InvalidCredentials {
  __typename: 'InvalidCredentials';
  message: string;
}
export interface AccountNotFound {
  __typename: 'AccountNotFound';
  message: string;
}
export interface InvalidResetCode {
  __typename: 'InvalidResetCode';
  message: string;
}
export interface PasswordResetRequested {
  __typename: 'PasswordResetRequested';
  email: string;
}
export interface ResetCodeVerified {
  __typename: 'ResetCodeVerified';
  email: string;
}
export interface PasswordChanged {
  __typename: 'PasswordChanged';
  email: string;
}

export type LoginResult = AuthSession | InvalidCredentials;
export type RequestPasswordResetResult = PasswordResetRequested | AccountNotFound;
export type VerifyResetCodeResult = ResetCodeVerified | InvalidResetCode;
export type ResetPasswordResult = PasswordChanged | InvalidResetCode | AccountNotFound;

export interface ApiError {
  message: string;
  code?: string;
}
