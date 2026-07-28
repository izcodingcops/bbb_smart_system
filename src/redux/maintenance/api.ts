import {apiSlice} from '../api/apiSlice';
import {withErrorLogging} from '../api/queryFnHelpers';
import {maintenanceService} from '../../api/services/maintenance/maintenanceService';
import {MaintenanceRequest} from '../../types/maintenance';

export const maintenanceApi = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getMaintenanceRequests: builder.query<MaintenanceRequest[], void>({
            queryFn: () =>
                withErrorLogging(
                    'MaintenanceApi',
                    'Failed to load maintenance requests.',
                    async () => {
                        const response = await maintenanceService.getMaintenanceRequests();
                        return response.data;
                    },
                ),
            providesTags: ['MaintenanceRequests'],
        }),
    }),
});

export const {useGetMaintenanceRequestsQuery} = maintenanceApi;