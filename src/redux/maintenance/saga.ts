import {call, put, takeLatest} from 'redux-saga/effects';
import {maintenanceService} from '../../api/services/maintenanceService';
import {OfflineError} from '../../api/offlineError';
import {logger} from '../../utils/logger';
import {
  MAINTENANCE_LIST_REQUEST,
  MAINTENANCE_DETAIL_REQUEST,
  MAINTENANCE_DROPDOWNS_REQUEST,
  MAINTENANCE_CREATE_REQUEST,
  MAINTENANCE_EDIT_REQUEST,
  MAINTENANCE_COMMENT_REQUEST,
  MAINTENANCE_DELETE_REQUEST,
} from './types';
import {
  maintenanceListSuccess,
  maintenanceListFailure,
  maintenanceDetailSuccess,
  maintenanceDetailFailure,
  maintenanceDropdownsSuccess,
  maintenanceDropdownsFailure,
  maintenanceCreateSuccess,
  maintenanceCreateQueued,
  maintenanceCreateFailure,
  maintenanceEditSuccess,
  maintenanceEditFailure,
  maintenanceCommentSuccess,
  maintenanceCommentFailure,
  maintenanceDeleteSuccess,
  maintenanceDeleteFailure,
} from './actions';
import {enqueueOfflineRecord} from '../offlineQueue/slice';

export function* fetchMaintenanceList(action: any) {
  try {
    const response: Awaited<ReturnType<typeof maintenanceService.list>> = yield call(
      maintenanceService.list,
      action.payload.page,
      action.payload.filters ?? {},
    );
    yield put(maintenanceListSuccess(response.data.rows));
  } catch (error: any) {
    logger.error('MaintenanceSaga', 'Failed to load list', error);
    yield put(maintenanceListFailure(error.message ?? 'Failed to load maintenance requests.'));
  }
}

export function* fetchMaintenanceDetail(action: any) {
  try {
    const response: Awaited<ReturnType<typeof maintenanceService.detail>> = yield call(
      maintenanceService.detail,
      action.payload.id,
    );
    yield put(maintenanceDetailSuccess(response.data));
  } catch (error: any) {
    logger.error('MaintenanceSaga', 'Failed to load detail', error);
    yield put(maintenanceDetailFailure(error.message ?? 'Failed to load maintenance request.'));
  }
}

export function* fetchMaintenanceDropdowns() {
  try {
    const response: Awaited<ReturnType<typeof maintenanceService.getDropdowns>> = yield call(
      maintenanceService.getDropdowns,
    );
    yield put(maintenanceDropdownsSuccess(response.data));
  } catch (error: any) {
    logger.error('MaintenanceSaga', 'Failed to load dropdowns', error);
    yield put(maintenanceDropdownsFailure(error.message ?? 'Failed to load dropdown options.'));
  }
}

export function* createMaintenance(action: any) {
  const {payload, image} = action.payload;
  try {
    const response: Awaited<ReturnType<typeof maintenanceService.create>> = yield call(
      maintenanceService.create,
      payload,
    );
    yield put(maintenanceCreateSuccess(response.data));
  } catch (error: any) {
    if (error instanceof OfflineError) {
      yield put(
        enqueueOfflineRecord({
          endpoint: 'addMaintenance-v2',
          baseUrl: 'WEB',
          payload,
          files: image ? [{fieldKey: 'image', uri: image.uri, name: image.name, type: image.type}] : [],
        }),
      );
      yield put(maintenanceCreateQueued());
      return;
    }
    logger.error('MaintenanceSaga', 'Failed to create', error);
    yield put(maintenanceCreateFailure(error.message ?? 'Failed to create maintenance request.'));
  }
}

export function* editMaintenance(action: any) {
  try {
    const response: Awaited<ReturnType<typeof maintenanceService.update>> = yield call(
      maintenanceService.update,
      action.payload.id,
      action.payload.payload,
    );
    yield put(maintenanceEditSuccess(response.data));
  } catch (error: any) {
    logger.error('MaintenanceSaga', 'Failed to edit', error);
    yield put(maintenanceEditFailure(error.message ?? 'Failed to update maintenance request.'));
  }
}

export function* addMaintenanceComment(action: any) {
  try {
    yield call(maintenanceService.addComment, action.payload.id, action.payload.text);
    yield put(maintenanceCommentSuccess());
  } catch (error: any) {
    logger.error('MaintenanceSaga', 'Failed to add comment', error);
    yield put(maintenanceCommentFailure(error.message ?? 'Failed to add comment.'));
  }
}

export function* deleteMaintenance(action: any) {
  try {
    yield call(maintenanceService.remove, action.payload.id);
    yield put(maintenanceDeleteSuccess(action.payload.id));
  } catch (error: any) {
    logger.error('MaintenanceSaga', 'Failed to delete', error);
    yield put(maintenanceDeleteFailure(error.message ?? 'Failed to delete maintenance request.'));
  }
}

export default function* maintenanceSaga() {
  yield takeLatest(MAINTENANCE_LIST_REQUEST, fetchMaintenanceList);
  yield takeLatest(MAINTENANCE_DETAIL_REQUEST, fetchMaintenanceDetail);
  yield takeLatest(MAINTENANCE_DROPDOWNS_REQUEST, fetchMaintenanceDropdowns);
  yield takeLatest(MAINTENANCE_CREATE_REQUEST, createMaintenance);
  yield takeLatest(MAINTENANCE_EDIT_REQUEST, editMaintenance);
  yield takeLatest(MAINTENANCE_COMMENT_REQUEST, addMaintenanceComment);
  yield takeLatest(MAINTENANCE_DELETE_REQUEST, deleteMaintenance);
}
