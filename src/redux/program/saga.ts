import {call, put, takeLatest} from 'redux-saga/effects';
import {programService} from '../../api/services/programService';
import {programListSuccess, programListFailure} from './actions';
import {PROGRAM_LIST_REQUEST} from './types';
import {logger} from '../../utils/logger';

function* fetchProgramListSaga() {
  try {
    logger.debug('ProgramSaga', 'Fetching program list');
    const response: Awaited<ReturnType<typeof programService.listPrograms>> =
      yield call(programService.listPrograms);
    logger.debug('ProgramSaga', 'Program list response', response.status);

    if (response.status !== 200) {
      yield put(programListFailure('Failed to load programs.'));
      return;
    }

    logger.info('ProgramSaga', `Loaded ${response.data.length} programs`);
    yield put(programListSuccess(response.data));
  } catch (error: any) {
    logger.error('ProgramSaga', 'Failed to fetch programs', error);
    yield put(programListFailure(error.message ?? 'Failed to load programs.'));
  }
}

export default function* programSaga() {
  yield takeLatest(PROGRAM_LIST_REQUEST, fetchProgramListSaga);
}
