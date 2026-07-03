import {generateId} from '../../../utils/generateId';
import {ShiftServiceContract, StartShiftBody} from './contract';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

export const mockShiftService = {
  startShift: (body: StartShiftBody) =>
    delay({
      status: 200,
      data: {
        id: generateId(),
        task_id: body.task_id,
        program_id: body.program_id,
        actual_shift_date: body.actual_shift_date,
        actual_shift_end_date: body.actual_shift_end_date,
      },
    }),
} satisfies ShiftServiceContract;
