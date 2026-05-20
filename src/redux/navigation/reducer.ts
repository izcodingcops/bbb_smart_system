import {UnknownAction} from 'redux';
import {NavigationState} from '../../types/navigation';
import {MENU_LIST_REQUEST, MENU_LIST_SUCCESS, MENU_LIST_FAILURE} from './types';

const initialState: NavigationState = {
  menuItems: [],
  isLoading: false,
  error: null,
};

export default function navigationReducer(
  state: NavigationState = initialState,
  action: UnknownAction,
): NavigationState {
  switch (action.type) {
    case MENU_LIST_REQUEST:
      return {...state, isLoading: true, error: null};
    case MENU_LIST_SUCCESS:
      return {...state, isLoading: false, menuItems: (action as any).payload};
    case MENU_LIST_FAILURE:
      return {...state, isLoading: false, error: (action as any).payload};
    default:
      return state;
  }
}
