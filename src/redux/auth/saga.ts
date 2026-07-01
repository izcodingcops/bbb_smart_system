import {call, put, takeLatest} from 'redux-saga/effects';
import {authService} from '../../api/services/authService';
import {loginSuccess, loginFailure, logoutSuccess} from './actions';
import {clearProgram} from '../program/slice';
import {AUTH_LOGIN, AUTH_LOGOUT} from './types';
import {LoginCredentials, User, Session} from '../../types/auth';
import {logger} from '../../utils/logger';
import {locationTracker} from '../../utils/locationTracker';

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
  logger.debug('AuthSaga', 'Logout');
  try {
    // Flush the leaving user's queued location points — uploaded under THEIR
    // still-current native session — before we wipe it. endSession resolves
    // false (never throws) if offline / nothing pending.
    yield call(locationTracker.endSession);
  } catch (e) {
    logger.warn('AuthSaga', 'endSession during logout failed', e);
  }
  // Clear the native session identity (user_id / sessionId / cube_url), stop
  // tracking, and drop any remaining queued points. Without this the NEXT user
  // inherits the previous user_id and their uploads are misattributed.
  locationTracker.stopTracking();
  yield put(logoutSuccess());
  yield put(clearProgram());
}

export default function* authSaga() {
  yield takeLatest(AUTH_LOGIN, loginSaga);
  yield takeLatest(AUTH_LOGOUT, logoutSaga);
}
