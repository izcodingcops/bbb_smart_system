import {generateId} from '../../../utils/generateId';
import {MOCK_PROGRAMS} from '../../../constants';
import {SelectProgramResponse, TaskItem} from '../../../types/program';
import {ProgramServiceContract, ProgramTaskListResponse} from './contract';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

const MOCK_TASKS: TaskItem[] = [
  {id: 'task-1', name: 'Morning Route'},
  {id: 'task-2', name: 'Afternoon Route'},
  {id: 'task-3', name: 'Evening Route'},
];

export const mockProgramService = {
  listPrograms: () => delay({status: 200, data: MOCK_PROGRAMS}),

  getTaskList: (_programId: string | number): Promise<ProgramTaskListResponse> =>
    delay({status: 200, data: {count: MOCK_TASKS.length, rows: MOCK_TASKS}}),

  selectProgram: (
    programId: string | number,
    shiftId: string | number,
  ): Promise<SelectProgramResponse> =>
    delay({
      status: 200,
      data: {id: generateId(), user_id: generateId(), program_id: programId, shift_id: shiftId},
    }),
} satisfies ProgramServiceContract;
