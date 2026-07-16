import {API_TRANSPORT} from '../../../config/transport';
import {mockWorkService} from './mockWorkService';
import {graphqlWorkService} from './graphqlWorkService';
import {WorkServiceContract} from './contract';

export const workService: WorkServiceContract =
  API_TRANSPORT.work === 'graphql' ? graphqlWorkService : mockWorkService;
