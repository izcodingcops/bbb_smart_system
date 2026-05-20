import {useAppSelector} from '../store';

export const GetMenuItems = () =>
  useAppSelector(state => state.navigation.menuItems);
export const GetMenuLoading = () =>
  useAppSelector(state => state.navigation.isLoading);
