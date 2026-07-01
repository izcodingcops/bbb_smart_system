import {apiSlice} from '../api/apiSlice';
import {maintenanceService} from '../../api/services/maintenanceService';
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

interface CreateResult {
  queued: boolean;
  record?: MaintenanceRecord;
}

export const maintenanceApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    list: builder.query<MaintenanceRecord[], {page: number; filters: MaintenanceListFilters}>({
      queryFn: async ({page, filters}) => {
        try {
          const response = await maintenanceService.list(page, filters);
          return {data: response.data.rows};
        } catch (error: any) {
          logger.error('MaintenanceApi', 'Failed to load list', error);
          return {error: {message: error?.message ?? 'Failed to load maintenance requests.'}};
        }
      },
      providesTags: ['MaintenanceList'],
    }),

    detail: builder.query<MaintenanceRecord, string>({
      queryFn: async id => {
        try {
          const response = await maintenanceService.detail(id);
          return {data: response.data};
        } catch (error: any) {
          logger.error('MaintenanceApi', 'Failed to load detail', error);
          return {error: {message: error?.message ?? 'Failed to load maintenance request.'}};
        }
      },
      providesTags: (_result, _error, id) => [{type: 'MaintenanceDetail', id}],
    }),

    dropdowns: builder.query<MaintenanceDropdowns, void>({
      queryFn: async () => {
        try {
          const response = await maintenanceService.getDropdowns();
          return {data: response.data};
        } catch (error: any) {
          logger.error('MaintenanceApi', 'Failed to load dropdowns', error);
          return {error: {message: error?.message ?? 'Failed to load dropdown options.'}};
        }
      },
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
      invalidatesTags: result => (result && !result.queued ? ['MaintenanceList'] : []),
    }),

    update: builder.mutation<MaintenanceRecord, {id: string; payload: MaintenancePayload}>({
      queryFn: async ({id, payload}) => {
        try {
          const response = await maintenanceService.update(id, payload);
          return {data: response.data};
        } catch (error: any) {
          logger.error('MaintenanceApi', 'Failed to edit', error);
          return {error: {message: error?.message ?? 'Failed to update maintenance request.'}};
        }
      },
      invalidatesTags: (_result, _error, {id}) => ['MaintenanceList', {type: 'MaintenanceDetail', id}],
    }),

    remove: builder.mutation<void, string>({
      queryFn: async id => {
        try {
          await maintenanceService.remove(id);
          return {data: undefined};
        } catch (error: any) {
          logger.error('MaintenanceApi', 'Failed to delete', error);
          return {error: {message: error?.message ?? 'Failed to delete maintenance request.'}};
        }
      },
      invalidatesTags: (_result, _error, id) => ['MaintenanceList', {type: 'MaintenanceDetail', id}],
    }),

    addComment: builder.mutation<void, {id: string; text: string}>({
      queryFn: async ({id, text}) => {
        try {
          await maintenanceService.addComment(id, text);
          return {data: undefined};
        } catch (error: any) {
          logger.error('MaintenanceApi', 'Failed to add comment', error);
          return {error: {message: error?.message ?? 'Failed to add comment.'}};
        }
      },
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
