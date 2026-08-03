import {useSelector} from 'react-redux';
import {RootState} from '../store';

export const GetOutboxItems = () =>
  useSelector((state: RootState) => state.outbox.items);
