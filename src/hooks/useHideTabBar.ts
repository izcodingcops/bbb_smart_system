import {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useAppDispatch} from '../redux/store';
import {setTabBarHidden} from '../redux/ui/slice';

/**
 * Hides the tab bar for as long as this screen is focused, and restores it on
 * blur. Full-screen pushes — a create form, a record detail — have no place
 * for the bar, while the list route underneath them keeps it.
 *
 * Tied to focus rather than mount so a push that is left behind (rather than
 * popped) still gives the bar back.
 */
export function useHideTabBar(): void {
  const dispatch = useAppDispatch();

  useFocusEffect(
    useCallback(() => {
      dispatch(setTabBarHidden(true));
      return () => {
        dispatch(setTabBarHidden(false));
      };
    }, [dispatch]),
  );
}
