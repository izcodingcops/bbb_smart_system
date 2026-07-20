import {createApi, fakeBaseQuery} from '@reduxjs/toolkit/query/react';

/**
 * Every endpoint injected into this api implements its own `queryFn`
 * delegating to the existing src/api/services/* layer (which already
 * handles live-vs-mock swapping and axios interceptors), so there's no
 * generic URL-based baseQuery here — fakeBaseQuery is the documented RTK
 * Query pattern for that.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<{message: string}>(),
  tagTypes: ['MenuItems', 'WorkItems', 'QuickActions', 'CheckedInEquipment'],
  endpoints: () => ({}),
});
