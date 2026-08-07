import React, {useEffect} from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {ApolloProvider} from '@apollo/client/react';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/redux/store';
import {apolloClient} from './src/graphql/client';
import {connectivity} from './src/graphql/offlineQueue/connectivity';
import {flushOutbox} from './src/graphql/offlineQueue/flush';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

const Splash = () => (
  <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'}}>
    <ActivityIndicator size="large" color="#1D4889" />
  </View>
);

/**
 * Renders as a child of `PersistGate` (not alongside it) so this only mounts
 * — and only reads `store.getState()` — after redux-persist has finished
 * rehydrating the outbox slice from AsyncStorage. Mounting this any higher
 * (e.g. in `App`'s own effect) would race rehydration and see an empty
 * queue every time. See Finding 1 in the offline-outbox review.
 */
const OfflineQueueSync: React.FC = () => {
  useEffect(() => {
    let cancelled = false;

    connectivity.init().then(() => {
      if (cancelled) {
        return;
      }
      if (connectivity.isOnline()) {
        flushOutbox();
      }
    });

    const unsubscribe = connectivity.onChange(online => {
      if (online && !cancelled) {
        flushOutbox();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary label="root">
      <Provider store={store}>
        <PersistGate loading={<Splash />} persistor={persistor}>
          <ApolloProvider client={apolloClient}>
            <SafeAreaProvider>
              <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
              <OfflineQueueSync />
              <AppNavigator />
            </SafeAreaProvider>
          </ApolloProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
