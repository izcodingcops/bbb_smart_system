import {useAppSelector} from '../store';

export const GetMaintenanceList = () => useAppSelector(state => state.maintenance.list);
export const GetMaintenanceListLoading = () => useAppSelector(state => state.maintenance.listLoading);
export const GetMaintenanceFilters = () => useAppSelector(state => state.maintenance.filters);
export const GetSelectedMaintenance = () => useAppSelector(state => state.maintenance.selected);
export const GetMaintenanceDropdowns = () => useAppSelector(state => state.maintenance.dropdowns);
export const GetMaintenanceSubmitting = () => useAppSelector(state => state.maintenance.isSubmitting);
export const GetMaintenanceSubmitError = () => useAppSelector(state => state.maintenance.submitError);
