import {GraphQLClient} from 'graphql-request';

/**
 * Placeholder endpoint. Replace with the real GraphQL URL when the backend
 * exists, then flip the relevant feature in src/config/transport.ts to
 * 'graphql'. Until then, graphql services throw a clear "not implemented"
 * error so an accidental switch fails loudly instead of silently.
 */
export const GRAPHQL_ENDPOINT = 'https://REPLACE_ME/graphql';

export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: () => ({
    // Authorization is injected per-request by service impls once wired.
  }),
});
