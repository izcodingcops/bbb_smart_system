import {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useAppDispatch} from '../redux/store';
import {setTabBarHidden} from '../redux/ui/slice';

export function useHideTabBar(): void {
  const dispatch = useAppDispatch();

  useFocusEffect(
    useCallback(() => {
      dispatch(setTabBarHidden(true));
      return () => dispatch(setTabBarHidden(false));
    }, [dispatch]),
  );
}
