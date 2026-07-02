import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';
import {API_MOCKS} from '../../config/apiMocks';
import {mockNavigationService} from './mockNavigationService';
import {NavigationServiceContract, NavigationMenuResponse} from './contracts';

const liveNavigationService = {
  getMenuItems: (): Promise<NavigationMenuResponse> =>
    client.get(ApiEndpoints.sideMenu).then(r => r.data),
} satisfies NavigationServiceContract;

export const navigationService: NavigationServiceContract = API_MOCKS.navigation
  ? mockNavigationService
  : liveNavigationService;
