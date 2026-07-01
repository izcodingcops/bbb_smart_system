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
import {MaintenanceState} from '../../types/maintenance';

const initialState: MaintenanceState = {
  list: [],
  listLoading: false,
  listError: null,
  filters: {},
  selected: null,
  selectedLoading: false,
  dropdowns: {types: [], departments: [], ambassadors: [], businesses: [], zones: []},
  dropdownsLoading: false,
  isSubmitting: false,
  submitError: null,
};

export default function maintenanceReducer(
  state: MaintenanceState = initialState,
  action: any,
): MaintenanceState {
  switch (action.type) {
    case MAINTENANCE_LIST_REQUEST:
      return {...state, listLoading: true, listError: null};
    case MAINTENANCE_LIST_SUCCESS:
      return {...state, listLoading: false, list: action.payload};
    case MAINTENANCE_LIST_FAILURE:
      return {...state, listLoading: false, listError: action.payload};
    case MAINTENANCE_SET_FILTERS:
      return {...state, filters: action.payload};

    case MAINTENANCE_DETAIL_REQUEST:
      return {...state, selectedLoading: true};
    case MAINTENANCE_DETAIL_SUCCESS:
      return {...state, selectedLoading: false, selected: action.payload};
    case MAINTENANCE_DETAIL_FAILURE:
      return {...state, selectedLoading: false};

    case MAINTENANCE_DROPDOWNS_REQUEST:
      return {...state, dropdownsLoading: true};
    case MAINTENANCE_DROPDOWNS_SUCCESS:
      return {...state, dropdownsLoading: false, dropdowns: action.payload};
    case MAINTENANCE_DROPDOWNS_FAILURE:
      return {...state, dropdownsLoading: false};

    case MAINTENANCE_CREATE_REQUEST:
      return {...state, isSubmitting: true, submitError: null};
    case MAINTENANCE_CREATE_SUCCESS:
      return {...state, isSubmitting: false, list: [action.payload, ...state.list]};
    case MAINTENANCE_CREATE_QUEUED:
      return {...state, isSubmitting: false};
    case MAINTENANCE_CREATE_FAILURE:
      return {...state, isSubmitting: false, submitError: action.payload};

    case MAINTENANCE_EDIT_REQUEST:
      return {...state, isSubmitting: true, submitError: null};
    case MAINTENANCE_EDIT_SUCCESS:
      return {
        ...state,
        isSubmitting: false,
        selected: action.payload,
        list: state.list.map(item => (item.id === action.payload.id ? action.payload : item)),
      };
    case MAINTENANCE_EDIT_FAILURE:
      return {...state, isSubmitting: false, submitError: action.payload};

    case MAINTENANCE_COMMENT_REQUEST:
      return {...state, isSubmitting: true};
    case MAINTENANCE_COMMENT_SUCCESS:
      return {...state, isSubmitting: false};
    case MAINTENANCE_COMMENT_FAILURE:
      return {...state, isSubmitting: false, submitError: action.payload};

    case MAINTENANCE_DELETE_REQUEST:
      return {...state, isSubmitting: true};
    case MAINTENANCE_DELETE_SUCCESS:
      return {
        ...state,
        isSubmitting: false,
        list: state.list.filter(item => item.id !== action.payload.id),
        selected: null,
      };
    case MAINTENANCE_DELETE_FAILURE:
      return {...state, isSubmitting: false, submitError: action.payload};

    default:
      return state;
  }
}
