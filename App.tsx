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

const Splash = () => (
  <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'}}>
    <ActivityIndicator size="large" color="#1D4889" />
  </View>
);

const App: React.FC = () => {
  useEffect(() => {
    connectivity.init();
    if (connectivity.isOnline()) {
      flushOutbox();
    }
    return connectivity.onChange(online => {
      if (online) {
        flushOutbox();
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<Splash />} persistor={persistor}>
        <ApolloProvider client={apolloClient}>
          <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            <AppNavigator />
          </SafeAreaProvider>
        </ApolloProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
