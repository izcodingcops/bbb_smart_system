import {useSelector} from 'react-redux';
import {RootState} from '../store';

export const GetHasActiveShift = () =>
  useSelector((state: RootState) => state.shift?.isActive ?? false);

export const GetActiveShiftTypeId = () =>
  useSelector((state: RootState) => state.shift?.shiftTypeId ?? null);

export const GetShiftStartTime = () =>
  useSelector((state: RootState) => state.shift?.startTime ?? null);

export const GetShiftStopTime = () =>
  useSelector((state: RootState) => state.shift?.stopTime ?? null);
