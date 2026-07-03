import {ProgramListResponse, SelectProgramResponse, TaskItem} from '../../../types/program';

export interface ProgramTaskListResponse {
  status: number;
  message?: string;
  data: {count: number; rows: TaskItem[]};
}

export interface ProgramServiceContract {
  listPrograms: () => Promise<ProgramListResponse>;
  getTaskList: (programId: string | number) => Promise<ProgramTaskListResponse>;
  selectProgram: (
    programId: string | number,
    shiftId: string | number,
  ) => Promise<SelectProgramResponse>;
}
