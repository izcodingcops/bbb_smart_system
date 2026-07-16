import {useSelector} from 'react-redux';
import {RootState} from '../store';

export const GetHasActiveShift = () =>
  useSelector((state: RootState) => state.shift.isActive);

export const GetActiveShiftTypeId = () =>
  useSelector((state: RootState) => state.shift.shiftTypeId);

export const GetShiftStartTime = () =>
  useSelector((state: RootState) => state.shift.startTime);

export const GetShiftStopTime = () =>
  useSelector((state: RootState) => state.shift.stopTime);
