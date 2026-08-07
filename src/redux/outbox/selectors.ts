import {useSelector} from 'react-redux';
import {RootState} from '../store';

export const GetOutboxItems = () =>
  useSelector((state: RootState) => state.outbox.items);

/** Items that exhausted their sync attempts and need the user's attention. */
export const GetFailedOutboxItems = () =>
  useSelector((state: RootState) => state.outbox.failed);
