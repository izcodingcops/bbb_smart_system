import {call, put, takeLatest} from 'redux-saga/effects';
import {programRepository} from '../../api/mockApi';
import {programListSuccess, programListFailure} from './actions';
import {PROGRAM_LIST_REQUEST} from './types';

function* fetchProgramListSaga() {
  try {
    const response: Awaited<ReturnType<typeof programRepository.listPrograms>> =
      yield call(programRepository.listPrograms);

    if (response.status !== 200) {
      yield put(programListFailure('Failed to load programs.'));
      return;
    }

    yield put(programListSuccess(response.data));
  } catch (error: any) {
    yield put(programListFailure(error.message ?? 'Failed to load programs.'));
  }
}

export default function* programSaga() {
  yield takeLatest(PROGRAM_LIST_REQUEST, fetchProgramListSaga);
}
