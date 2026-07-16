import {
  QuickActionsResponse,
  WorkListResponse,
  WorkServiceContract,
} from './contract';

/**
 * GraphQL implementation of the work contract. Not yet wired to a schema —
 * throws so switching API_TRANSPORT.work to 'graphql' fails loudly. Replace
 * the bodies with graphqlClient.request(...) queries when the backend lands.
 */
export const graphqlWorkService = {
  getWorkItems: (): Promise<WorkListResponse> => {
    throw new Error('graphqlWorkService.getWorkItems not implemented yet');
  },
  getQuickActions: (): Promise<QuickActionsResponse> => {
    throw new Error('graphqlWorkService.getQuickActions not implemented yet');
  },
} satisfies WorkServiceContract;
