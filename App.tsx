import './global.css';
import React from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';

const Splash = () => (
  <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'}}>
    <ActivityIndicator size="large" color="#1D4889" />
  </View>
);

const App: React.FC = () => (
  <Provider store={store}>
    <PersistGate loading={<Splash />} persistor={persistor}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <AppNavigator />
      </SafeAreaProvider>
    </PersistGate>
  </Provider>
);

export default App;
