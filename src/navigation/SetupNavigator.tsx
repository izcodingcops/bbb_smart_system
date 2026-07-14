import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GetPrograms} from '../redux/selectors';
import ProgramSelectionScreen from '../screens/ProgramSelectionScreen';
import ShiftSetupScreen from '../screens/ShiftSetupScreen';
import {theme} from '../theme';

export type SetupStackParamList = {
  ProgramSelection: undefined;
  ShiftSetup: undefined;
};

const Stack = createNativeStackNavigator<SetupStackParamList>();

// Two-step post-login setup: pick a program (only when 2+), then configure the
// shift. Single-program users start straight at ShiftSetup.
const SetupNavigator: React.FC = () => {
  const programs = GetPrograms();
  const initialRoute = programs.length > 1 ? 'ProgramSelection' : 'ShiftSetup';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: theme.colors.background},
      }}>
      <Stack.Screen name="ProgramSelection" component={ProgramSelectionScreen} />
      <Stack.Screen name="ShiftSetup" component={ShiftSetupScreen} />
    </Stack.Navigator>
  );
};

export default SetupNavigator;
