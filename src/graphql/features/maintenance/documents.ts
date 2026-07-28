import {gql} from '@apollo/client';

export const GET_MAINTENANCE_REQUESTS = gql`
  query GetMaintenanceRequests($programId: ID!, $filter: MaintenanceFilter) {
    maintenanceRequests(programId: $programId, filter: $filter) {
      id
      reference
      type
      status
      requestedAt
      businessName
      priority
      assignee {
        name
        initials
      }
      address
      routedToSupervisor
      queuedOffline
    }
  }
`;
