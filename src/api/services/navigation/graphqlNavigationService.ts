import {NavigationServiceContract, NavigationMenuResponse} from './contract';

export const graphqlNavigationService = {
  getMenuItems: (): Promise<NavigationMenuResponse> => {
    throw new Error('graphqlNavigationService.getMenuItems not implemented yet');
  },
} satisfies NavigationServiceContract;
