import {
  MaintenanceListFilters,
  MaintenancePayload,
  MaintenanceImage,
  MaintenanceRecord,
  MaintenanceDropdowns,
} from '../../types/maintenance';
import {
  MAINTENANCE_LIST_REQUEST,
  MAINTENANCE_LIST_SUCCESS,
  MAINTENANCE_LIST_FAILURE,
  MAINTENANCE_SET_FILTERS,
  MAINTENANCE_DETAIL_REQUEST,
  MAINTENANCE_DETAIL_SUCCESS,
  MAINTENANCE_DETAIL_FAILURE,
  MAINTENANCE_DROPDOWNS_REQUEST,
  MAINTENANCE_DROPDOWNS_SUCCESS,
  MAINTENANCE_DROPDOWNS_FAILURE,
  MAINTENANCE_CREATE_REQUEST,
  MAINTENANCE_CREATE_SUCCESS,
  MAINTENANCE_CREATE_QUEUED,
  MAINTENANCE_CREATE_FAILURE,
  MAINTENANCE_EDIT_REQUEST,
  MAINTENANCE_EDIT_SUCCESS,
  MAINTENANCE_EDIT_FAILURE,
  MAINTENANCE_COMMENT_REQUEST,
  MAINTENANCE_COMMENT_SUCCESS,
  MAINTENANCE_COMMENT_FAILURE,
  MAINTENANCE_DELETE_REQUEST,
  MAINTENANCE_DELETE_SUCCESS,
  MAINTENANCE_DELETE_FAILURE,
} from './types';

export const requestMaintenanceList = (page: number, filters: MaintenanceListFilters = {}) => ({
  type: MAINTENANCE_LIST_REQUEST,
  payload: {page, filters},
});
export const maintenanceListSuccess = (rows: MaintenanceRecord[]) => ({
  type: MAINTENANCE_LIST_SUCCESS,
  payload: rows,
});
export const maintenanceListFailure = (error: string) => ({type: MAINTENANCE_LIST_FAILURE, payload: error});
export const setMaintenanceFilters = (filters: MaintenanceListFilters) => ({
  type: MAINTENANCE_SET_FILTERS,
  payload: filters,
});

export const requestMaintenanceDetail = (id: string) => ({type: MAINTENANCE_DETAIL_REQUEST, payload: {id}});
export const maintenanceDetailSuccess = (record: MaintenanceRecord) => ({
  type: MAINTENANCE_DETAIL_SUCCESS,
  payload: record,
});
export const maintenanceDetailFailure = (error: string) => ({type: MAINTENANCE_DETAIL_FAILURE, payload: error});

export const requestMaintenanceDropdowns = () => ({type: MAINTENANCE_DROPDOWNS_REQUEST});
export const maintenanceDropdownsSuccess = (dropdowns: MaintenanceDropdowns) => ({
  type: MAINTENANCE_DROPDOWNS_SUCCESS,
  payload: dropdowns,
});
export const maintenanceDropdownsFailure = (error: string) => ({
  type: MAINTENANCE_DROPDOWNS_FAILURE,
  payload: error,
});

export const requestMaintenanceCreate = (payload: MaintenancePayload, image: MaintenanceImage | null) => ({
  type: MAINTENANCE_CREATE_REQUEST,
  payload: {payload, image},
});
export const maintenanceCreateSuccess = (record: MaintenanceRecord) => ({
  type: MAINTENANCE_CREATE_SUCCESS,
  payload: record,
});
export const maintenanceCreateQueued = () => ({type: MAINTENANCE_CREATE_QUEUED});
export const maintenanceCreateFailure = (error: string) => ({type: MAINTENANCE_CREATE_FAILURE, payload: error});

export const requestMaintenanceEdit = (id: string, payload: MaintenancePayload) => ({
  type: MAINTENANCE_EDIT_REQUEST,
  payload: {id, payload},
});
export const maintenanceEditSuccess = (record: MaintenanceRecord) => ({
  type: MAINTENANCE_EDIT_SUCCESS,
  payload: record,
});
export const maintenanceEditFailure = (error: string) => ({type: MAINTENANCE_EDIT_FAILURE, payload: error});

export const requestMaintenanceComment = (id: string, text: string) => ({
  type: MAINTENANCE_COMMENT_REQUEST,
  payload: {id, text},
});
export const maintenanceCommentSuccess = () => ({type: MAINTENANCE_COMMENT_SUCCESS});
export const maintenanceCommentFailure = (error: string) => ({type: MAINTENANCE_COMMENT_FAILURE, payload: error});

export const requestMaintenanceDelete = (id: string) => ({type: MAINTENANCE_DELETE_REQUEST, payload: {id}});
export const maintenanceDeleteSuccess = (id: string) => ({type: MAINTENANCE_DELETE_SUCCESS, payload: {id}});
export const maintenanceDeleteFailure = (error: string) => ({type: MAINTENANCE_DELETE_FAILURE, payload: error});
