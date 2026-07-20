import {API_TRANSPORT} from '../../../config/transport';
import {mockEquipmentService} from './mockEquipmentService';
import {graphqlEquipmentService} from './graphqlEquipmentService';
import {EquipmentServiceContract} from './contract';

export const equipmentService: EquipmentServiceContract =
  API_TRANSPORT.equipment === 'graphql'
    ? graphqlEquipmentService
    : mockEquipmentService;
