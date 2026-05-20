import {Program} from '../../types/program';
import {
  PROGRAM_LIST_REQUEST,
  PROGRAM_LIST_SUCCESS,
  PROGRAM_LIST_FAILURE,
  PROGRAM_SELECT,
  PROGRAM_CLEAR,
} from './types';

export const requestProgramList = () => ({type: PROGRAM_LIST_REQUEST});

export const programListSuccess = (programs: Program[]) => ({
  type: PROGRAM_LIST_SUCCESS,
  payload: {programs},
});

export const programListFailure = (error: string) => ({
  type: PROGRAM_LIST_FAILURE,
  payload: error,
});

export const selectProgram = (program: Program) => ({
  type: PROGRAM_SELECT,
  payload: program,
});

export const clearProgram = () => ({type: PROGRAM_CLEAR});
