import {API_TRANSPORT} from '../../../config/transport';
import {mockMaintenanceService} from './mockMaintenanceService';
import {graphqlMaintenanceService} from './graphqlMaintenanceService';
import {MaintenanceServiceContract} from './contract';

export const maintenanceService: MaintenanceServiceContract =
  API_TRANSPORT.maintenance === 'graphql'
    ? graphqlMaintenanceService
    : mockMaintenanceService;