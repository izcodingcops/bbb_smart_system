import {call, put, takeLatest} from 'redux-saga/effects';
import {authRepository} from '../../api/mockApi';
import {loginSuccess, loginFailure, logoutSuccess} from './actions';
import {clearProgram} from '../program/actions';
import {AUTH_LOGIN, AUTH_LOGOUT} from './types';
import {LoginCredentials, User, Session} from '../../types/auth';

function* loginSaga(action: {type: string; payload: LoginCredentials}) {
  try {
    const response: Awaited<ReturnType<typeof authRepository.login>> =
      yield call(authRepository.login, action.payload);

    if (response.status !== 200) {
      yield put(loginFailure(response.message ?? 'Login failed.'));
      return;
    }

    const user: User = {
      id: String(response.data.id),
      name: response.data.name,
      username: response.data.username,
      email: response.data.email,
      avatar: response.data.avatar,
      enable_shift_entry: response.data.enable_shift_entry,
    };

    const session: Session = {
      token: response.data.token,
    };

    yield put(loginSuccess({user, session}));
  } catch (error: any) {
    yield put(loginFailure(error.message ?? 'Login failed.'));
  }
}

function* logoutSaga() {
  try {
    yield put(logoutSuccess());
    yield put(clearProgram());
  } catch {
    yield put(logoutSuccess());
    yield put(clearProgram());
  }
}

export default function* authSaga() {
  yield takeLatest(AUTH_LOGIN, loginSaga);
  yield takeLatest(AUTH_LOGOUT, logoutSaga);
}
