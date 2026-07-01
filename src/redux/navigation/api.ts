import {apiSlice} from '../api/apiSlice';
import {navigationRepository} from '../../api/mockApi';
import {MenuItem} from '../../types/navigation';

export const navigationApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getMenuItems: builder.query<MenuItem[], void>({
      queryFn: async () => {
        try {
          const items = await navigationRepository.getMenuItems();
          return {data: items};
        } catch (error: any) {
          return {error: {message: error?.message ?? 'Failed to load menu.'}};
        }
      },
      providesTags: ['MenuItems'],
    }),
  }),
});

export const {useGetMenuItemsQuery} = navigationApi;
