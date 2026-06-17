import {call, put, takeLatest} from 'redux-saga/effects';
import {authService} from '../../api/services/authService';
import {loginSuccess, loginFailure, logoutSuccess} from './actions';
import {clearProgram} from '../program/actions';
import {AUTH_LOGIN, AUTH_LOGOUT} from './types';
import {LoginCredentials, User, Session} from '../../types/auth';
import {logger} from '../../utils/logger';

function* loginSaga(action: {type: string; payload: LoginCredentials}) {
  try {
    logger.debug('AuthSaga', 'Login request', action.payload.username);
    const response: Awaited<ReturnType<typeof authService.login>> =
      yield call(authService.login, action.payload);
    logger.debug('AuthSaga', 'Login response', response.status);

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

    const session: Session = {token: response.data.token};

    logger.info('AuthSaga', 'Login success', user.username);
    yield put(loginSuccess({user, session}));
  } catch (error: any) {
    logger.error('AuthSaga', 'Login failed', error);
    yield put(loginFailure(error.message ?? 'Login failed.'));
  }
}

function* logoutSaga() {
  try {
    logger.debug('AuthSaga', 'Logout');
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
