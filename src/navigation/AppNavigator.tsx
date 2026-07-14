import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GetIsAuthenticated} from '../redux/auth/selectors';
import {GetHasActiveShift} from '../redux/shift/selectors';
import LoginScreen from '../screens/LoginScreen';
import SetupNavigator from './SetupNavigator';
import MainTabNavigator from './MainTabNavigator';
import {theme} from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Setup: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = GetIsAuthenticated();
  const hasActiveShift = GetHasActiveShift();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {backgroundColor: theme.colors.background},
        }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !hasActiveShift ? (
          <Stack.Screen name="Setup" component={SetupNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
