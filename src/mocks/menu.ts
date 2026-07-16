import {MenuItem} from '../types/navigation';

export const MOCK_MENU_ITEMS = [
  {id: 'home', menu_name: 'Home', screen_name: 'Home', menu_icon: 'home', position: 'bottom'},
  {id: 'work', menu_name: 'Work', screen_name: 'Work', menu_icon: 'incident', position: 'bottom'},
  {
    id: 'maintenance',
    menu_name: 'Maintenance',
    screen_name: 'Maintenance',
    menu_icon: 'maintenance',
    position: 'bottom',
  },
  {
    id: 'fixture',
    menu_name: 'Fixture',
    screen_name: 'Fixture',
    menu_icon: 'fixture',
    position: 'bottom',
  },
  {
    id: 'profile',
    menu_name: 'Profile',
    screen_name: 'Profile',
    menu_icon: 'profile',
    position: 'more',
  },
  {
    id: 'incidents',
    menu_name: 'Incidents',
    screen_name: 'Incidents',
    menu_icon: 'incident',
    position: 'more',
  },
] satisfies MenuItem[];
