import {apiSlice} from '../api/apiSlice';
import {withErrorLogging} from '../api/queryFnHelpers';
import {maintenanceService} from '../../api/services/maintenance/maintenanceService';
import {OfflineError} from '../../api/offlineError';
import {enqueueOfflineRecord} from '../offlineQueue/slice';
import {logger} from '../../utils/logger';
import {
  MaintenanceRecord,
  MaintenancePayload,
  MaintenanceImage,
  MaintenanceDropdowns,
  MaintenanceListFilters,
} from '../../types/maintenance';

interface CreateArgs {
  payload: MaintenancePayload;
  image: MaintenanceImage | null;
}

type CreateResult = {queued: true} | {queued: false; record: MaintenanceRecord};

export const maintenanceApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    list: builder.query<MaintenanceRecord[], {page: number; filters: MaintenanceListFilters}>({
      queryFn: ({page, filters}) =>
        withErrorLogging('MaintenanceApi', 'Failed to load maintenance requests.', async () => {
          const response = await maintenanceService.list(page, filters);
          return response.data.rows;
        }),
      providesTags: ['MaintenanceList'],
    }),

    detail: builder.query<MaintenanceRecord, string>({
      queryFn: id =>
        withErrorLogging('MaintenanceApi', 'Failed to load maintenance request.', async () => {
          const response = await maintenanceService.detail(id);
          return response.data;
        }),
      providesTags: (_result, _error, id) => [{type: 'MaintenanceDetail', id}],
    }),

    dropdowns: builder.query<MaintenanceDropdowns, void>({
      queryFn: () =>
        withErrorLogging('MaintenanceApi', 'Failed to load dropdown options.', async () => {
          const response = await maintenanceService.getDropdowns();
          return response.data;
        }),
      providesTags: ['MaintenanceDropdowns'],
    }),

    create: builder.mutation<CreateResult, CreateArgs>({
      queryFn: async ({payload, image}, {dispatch}) => {
        try {
          const response = await maintenanceService.create(payload);
          return {data: {queued: false, record: response.data}};
        } catch (error: any) {
          if (error instanceof OfflineError) {
            dispatch(
              enqueueOfflineRecord({
                endpoint: 'addMaintenance-v2',
                baseUrl: 'WEB',
                payload: {...payload},
                files: image ? [{fieldKey: 'image', uri: image.uri, name: image.name, type: image.type}] : [],
              }),
            );
            return {data: {queued: true}};
          }
          logger.error('MaintenanceApi', 'Failed to create', error);
          return {error: {message: error?.message ?? 'Failed to create maintenance request.'}};
        }
      },
      invalidatesTags: result => (result?.queued === false ? ['MaintenanceList'] : []),
    }),

    update: builder.mutation<MaintenanceRecord, {id: string; payload: MaintenancePayload}>({
      queryFn: ({id, payload}) =>
        withErrorLogging('MaintenanceApi', 'Failed to update maintenance request.', async () => {
          const response = await maintenanceService.update(id, payload);
          return response.data;
        }),
      invalidatesTags: (_result, _error, {id}) => ['MaintenanceList', {type: 'MaintenanceDetail', id}],
    }),

    remove: builder.mutation<void, string>({
      queryFn: id =>
        withErrorLogging('MaintenanceApi', 'Failed to delete maintenance request.', async () => {
          await maintenanceService.remove(id);
        }),
      invalidatesTags: (_result, _error, id) => ['MaintenanceList', {type: 'MaintenanceDetail', id}],
    }),

    addComment: builder.mutation<void, {id: string; text: string}>({
      queryFn: ({id, text}) =>
        withErrorLogging('MaintenanceApi', 'Failed to add comment.', async () => {
          await maintenanceService.addComment(id, text);
        }),
    }),
  }),
});

export const {
  useListQuery: useListMaintenanceQuery,
  useDetailQuery: useGetMaintenanceDetailQuery,
  useDropdownsQuery: useGetMaintenanceDropdownsQuery,
  useCreateMutation: useCreateMaintenanceMutation,
  useUpdateMutation: useUpdateMaintenanceMutation,
  useRemoveMutation: useRemoveMaintenanceMutation,
  useAddCommentMutation: useAddMaintenanceCommentMutation,
} = maintenanceApi;
