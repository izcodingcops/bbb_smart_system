import {useSelector} from 'react-redux';
import {RootState} from '../store';

export const GetGlobalToast = () =>
  useSelector((state: RootState) => state.ui.globalToast);
