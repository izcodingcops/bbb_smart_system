import {MaintenanceListResponse, MaintenanceServiceContract} from './contract';

/**
 * GraphQL implementation of the maintenance contract. Not yet wired to a
 * schema — throws so switching API_TRANSPORT.maintenance to 'graphql' fails
 * loudly rather than silently returning nothing.
 */
export const graphqlMaintenanceService = {
  getMaintenanceRequests: (): Promise<MaintenanceListResponse> => {
    throw new Error(
      'graphqlMaintenanceService.getMaintenanceRequests not implemented yet',
    );
  },
} satisfies MaintenanceServiceContract;