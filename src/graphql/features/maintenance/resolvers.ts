import {MOCK_MAINTENANCE_REQUESTS} from '../../../mocks/maintenance';
import {sleep} from '../../mockSession';

const STATUS: Record<string, string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};
const PRIORITY: Record<string, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

export const maintenanceResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side.
    // When the server implements it, the document and call site already match.
    maintenanceRequests: async () => {
      await sleep();
      return MOCK_MAINTENANCE_REQUESTS.map(request => ({
        id: request.id,
        reference: request.id,
        type: request.type,
        status: STATUS[request.status],
        requestedAt: request.requestedAt,
        businessName: request.businessName,
        priority: PRIORITY[request.priority],
        assignee: request.assignee,
        address: request.address,
        routedToSupervisor: request.routedToSupervisor,
        queuedOffline: request.queuedOffline,
      }));
    },
  },
};
