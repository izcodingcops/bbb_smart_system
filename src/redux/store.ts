import {configureStore} from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import rootReducer from './rootReducer';
import rootSaga from './rootSaga';
import {apiSlice} from './api/apiSlice';
import {startConnectivitySync} from './connectivitySync';
import {resetOfflineSyncing} from './offlineQueue/slice';

const sagaMiddleware = createSagaMiddleware();

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['location', 'api'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({thunk: false, serializableCheck: false})
      .concat(sagaMiddleware)
      .concat(apiSlice.middleware),
});
export const persistor = persistStore(store);

sagaMiddleware.run(rootSaga);

store.dispatch(resetOfflineSyncing());
startConnectivitySync(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
