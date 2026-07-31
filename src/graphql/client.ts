import {ApolloClient, ApolloLink, HttpLink} from '@apollo/client';
import {SetContextLink} from '@apollo/client/link/context';
import {ErrorLink} from '@apollo/client/link/error';
import {SchemaLink} from '@apollo/client/link/schema';
import {API_TRANSPORT, Feature, GRAPHQL_ENDPOINT} from '../config/transport';
import {logger} from '../utils/logger';
import {authToken} from './authToken';
import {cache} from './cache';
import {loadApolloDevMessages} from './devMessages';
import {mockSchema} from './mockSchema';

loadApolloDevMessages();

const authLink = new SetContextLink(prevContext => {
  const token = authToken.get();
  return {
    ...prevContext,
    headers: {
      ...prevContext.headers,
      ...(token ? {authorization: `Bearer ${token}`} : {}),
    },
  };
});

const errorLink = new ErrorLink(({error, operation}) => {
  logger.error('Apollo', `Operation ${operation.operationName} failed`, error);
});

/**
 * `validate: true` is not optional. SchemaLink defaults it to false, which runs
 * graphql-js execute() without validate() — a typo'd field then resolves to
 * nothing instead of erroring, and the mock stops catching the one class of bug
 * it exists to catch.
 */
const mockLink = new SchemaLink({
  schema: mockSchema,
  validate: true,
  context: () => ({token: authToken.get()}),
});

const httpLink = new HttpLink({uri: GRAPHQL_ENDPOINT});

/**
 * Routes each operation by the `feature` its hook put on the context.
 * Anything that is not explicitly set to 'graphql' — no feature, a feature
 * mapped to 'mock', or an unrecognised feature string — stays on the mock, so
 * a forgotten context or a typo can never accidentally hit the network.
 */
const transportLink = ApolloLink.split(
  operation => {
    const feature = operation.getContext().feature as Feature | undefined;
    return !feature || API_TRANSPORT[feature] !== 'graphql';
  },
  mockLink,
  httpLink,
);

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, transportLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      // Apollo Client 4 defaults this to true, so every refetchQueries-driven
      // refetch (e.g. a status change) flips a screen's `loading` back to true
      // and its `isLoading` gate swaps the whole list for a spinner and back —
      // a full-screen flash for what should be a silent background update.
      notifyOnNetworkStatusChange: false,
    },
  },
});
