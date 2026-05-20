import {call, put, takeLatest} from 'redux-saga/effects';
import {navigationRepository} from '../../api/mockApi';
import {menuListSuccess, menuListFailure} from './actions';
import {MENU_LIST_REQUEST} from './types';

function* fetchMenuListSaga() {
  try {
    const items: Awaited<ReturnType<typeof navigationRepository.getMenuItems>> =
      yield call(navigationRepository.getMenuItems);
    yield put(menuListSuccess(items));
  } catch (error: any) {
    yield put(menuListFailure(error.message ?? 'Failed to load menu.'));
  }
}

export default function* navigationSaga() {
  yield takeLatest(MENU_LIST_REQUEST, fetchMenuListSaga);
}
