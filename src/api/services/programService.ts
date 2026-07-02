import {ProgramListResponse, SelectProgramResponse} from '../../types/program';
import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';
import {API_MOCKS} from '../../config/apiMocks';
import {mockProgramService} from './mockProgramService';
import {ProgramServiceContract, ProgramTaskListResponse} from './contracts';

const liveProgramService = {
  listPrograms: (): Promise<ProgramListResponse> =>
    client.get<ProgramListResponse>(ApiEndpoints.programList).then(r => r.data),

  getTaskList: (programId: string | number): Promise<ProgramTaskListResponse> =>
    client.get(`${ApiEndpoints.taskList}?programId=${programId}`).then(r => r.data),

  selectProgram: (
    programId: string | number,
    shiftId: string | number,
  ): Promise<SelectProgramResponse> =>
    client
      .post<SelectProgramResponse>(ApiEndpoints.selectProgram, {id: programId, shift_id: shiftId})
      .then(r => r.data),
} satisfies ProgramServiceContract;

export const programService: ProgramServiceContract = API_MOCKS.program
  ? mockProgramService
  : liveProgramService;
