import {MenuItem} from '../../types/navigation';
import {MENU_LIST_REQUEST, MENU_LIST_SUCCESS, MENU_LIST_FAILURE} from './types';

export const requestMenuList = () => ({type: MENU_LIST_REQUEST});

export const menuListSuccess = (items: MenuItem[]) => ({
  type: MENU_LIST_SUCCESS,
  payload: items,
});

export const menuListFailure = (error: string) => ({
  type: MENU_LIST_FAILURE,
  payload: error,
});
