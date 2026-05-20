import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GetIsAuthenticated} from '../redux/auth/selectors';
import {GetSelectedProgram} from '../redux/program/selectors';
import LoginScreen from '../screens/LoginScreen';
import SelectProgramScreen from '../screens/SelectProgramScreen';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
  Login: undefined;
  SelectProgram: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = GetIsAuthenticated();
  const selectedProgram = GetSelectedProgram();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false, animation: 'fade'}}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !selectedProgram ? (
          <Stack.Screen name="SelectProgram" component={SelectProgramScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
