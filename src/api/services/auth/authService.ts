import {API_TRANSPORT} from '../../../config/transport';
import {mockAuthService} from './mockAuthService';
import {graphqlAuthService} from './graphqlAuthService';
import {AuthServiceContract} from './contract';

export const authService: AuthServiceContract =
  API_TRANSPORT.auth === 'graphql' ? graphqlAuthService : mockAuthService;
