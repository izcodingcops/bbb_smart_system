import {call, put, takeLatest} from 'redux-saga/effects';
import {navigationRepository} from '../../api/mockApi';
import {menuListSuccess, menuListFailure} from './actions';
import {MENU_LIST_REQUEST} from './types';
import {logger} from '../../utils/logger';

function* fetchMenuListSaga() {
  try {
    logger.debug('NavigationSaga', 'Loading menu');
    const items: Awaited<ReturnType<typeof navigationRepository.getMenuItems>> =
      yield call(navigationRepository.getMenuItems);
    logger.info('NavigationSaga', `Loaded ${items.length} menu items`);
    yield put(menuListSuccess(items));
  } catch (error: any) {
    logger.error('NavigationSaga', 'Failed to load menu', error);
    yield put(menuListFailure(error.message ?? 'Failed to load menu.'));
  }
}

export default function* navigationSaga() {
  yield takeLatest(MENU_LIST_REQUEST, fetchMenuListSaga);
}
