import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import CreateNewPasswordScreen from '../screens/auth/CreateNewPasswordScreen';
import {theme} from '../theme';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  VerifyOtp: {email: string};
  CreateNewPassword: {email: string; code: string};
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Unauthenticated flow: sign-in plus the forgot-password journey.
const AuthNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
    <Stack.Screen name="CreateNewPassword" component={CreateNewPasswordScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
