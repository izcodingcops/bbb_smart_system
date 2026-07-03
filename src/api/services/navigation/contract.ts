import {MenuItem} from '../../../types/navigation';

export interface NavigationMenuResponse {
  status: number;
  data: MenuItem[];
}

export interface NavigationServiceContract {
  getMenuItems: () => Promise<NavigationMenuResponse>;
}
