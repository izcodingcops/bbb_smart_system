import {UnknownAction} from 'redux';
import {ProgramState} from '../../types/program';
import {
  PROGRAM_LIST_REQUEST,
  PROGRAM_LIST_SUCCESS,
  PROGRAM_LIST_FAILURE,
  PROGRAM_SELECT,
  PROGRAM_CLEAR,
} from './types';

const initialState: ProgramState = {
  programs: [],
  selectedProgram: null,
  isLoading: false,
  error: null,
};

export default function programReducer(
  state: ProgramState = initialState,
  action: UnknownAction,
): ProgramState {
  switch (action.type) {
    case PROGRAM_LIST_REQUEST:
      return {...state, isLoading: true, error: null};

    case PROGRAM_LIST_SUCCESS: {
      const {programs} = (action as any).payload;
      return {...state, isLoading: false, programs};
    }

    case PROGRAM_LIST_FAILURE:
      return {...state, isLoading: false, error: (action as any).payload};

    case PROGRAM_SELECT:
      return {...state, selectedProgram: (action as any).payload};

    case PROGRAM_CLEAR:
      return {...state, selectedProgram: null};

    default:
      return state;
  }
}
