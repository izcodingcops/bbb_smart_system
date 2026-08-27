import {useSelector} from 'react-redux';
import {RootState} from '../store';

export const GetLanguage = () =>
  useSelector((state: RootState) => state.settings.language);

export const GetNotificationSettings = () =>
  useSelector((state: RootState) => state.settings.notifications);
