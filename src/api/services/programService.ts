import {ProgramListResponse, SelectProgramResponse} from '../../types/program';
import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';

export const programService = {
  listPrograms: (): Promise<ProgramListResponse> =>
    client.get<ProgramListResponse>(ApiEndpoints.programList).then(r => r.data),

  getTaskList: (programId: string | number): Promise<{
    status: number;
    message?: string;
    data: {count: number; rows: any[]};
  }> =>
    client.get(`${ApiEndpoints.taskList}?programId=${programId}`).then(r => r.data),

  selectProgram: (programId: string | number, shiftId: string | number): Promise<SelectProgramResponse> =>
    client.post<SelectProgramResponse>(ApiEndpoints.selectProgram, {id: programId, shift_id: shiftId}).then(r => r.data),
};
