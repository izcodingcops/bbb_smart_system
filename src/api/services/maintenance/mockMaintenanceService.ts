import {MOCK_MAINTENANCE_REQUESTS} from '../../../mocks/maintenance';
import {MaintenanceServiceContract} from './contract';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

export const mockMaintenanceService = {
    getMaintenanceRequests: () =>
        delay({status: 200, data: MOCK_MAINTENANCE_REQUESTS}),
} satisfies MaintenanceServiceContract;