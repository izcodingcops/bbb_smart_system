import client from '../../index';
import {ApiEndpoints} from '../../apiEndpoints';
import {API_MOCKS} from '../../../config/apiMocks';
import {mockShiftService} from './mockShiftService';
import {ShiftServiceContract, StartShiftBody} from './contract';

const liveShiftService = {
  startShift: (body: StartShiftBody): Promise<{status: number; data: any}> =>
    client.post(ApiEndpoints.startShift, body).then(r => r.data),
} satisfies ShiftServiceContract;

export const shiftService: ShiftServiceContract = API_MOCKS.shift
  ? mockShiftService
  : liveShiftService;
