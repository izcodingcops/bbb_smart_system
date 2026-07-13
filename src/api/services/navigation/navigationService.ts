import {API_TRANSPORT} from '../../../config/transport';
import {mockNavigationService} from './mockNavigationService';
import {graphqlNavigationService} from './graphqlNavigationService';
import {NavigationServiceContract} from './contract';

export const navigationService: NavigationServiceContract =
  API_TRANSPORT.navigation === 'graphql'
    ? graphqlNavigationService
    : mockNavigationService;
