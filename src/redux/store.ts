import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import rootReducer from './rootReducer';
import {apiSlice} from './api/apiSlice';
import {startConnectivitySync} from './connectivitySync';
import {resetOfflineSyncing} from './offlineQueue/slice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['location', 'api'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({serializableCheck: false}).concat(apiSlice.middleware),
});
export const persistor = persistStore(store);

store.dispatch(resetOfflineSyncing());
startConnectivitySync(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
