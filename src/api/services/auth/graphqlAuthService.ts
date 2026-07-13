import {LoginCredentials, LoginResponse} from '../../../types/auth';
import {AuthServiceContract} from './contract';

/**
 * GraphQL implementation of the auth contract. Not yet wired to a schema —
 * throws so switching API_TRANSPORT.auth to 'graphql' fails loudly. Replace
 * the body with a graphqlClient.request(...) mutation when the backend lands.
 */
export const graphqlAuthService = {
  login: (_credentials: LoginCredentials): Promise<LoginResponse> => {
    throw new Error('graphqlAuthService.login not implemented yet');
  },
} satisfies AuthServiceContract;
