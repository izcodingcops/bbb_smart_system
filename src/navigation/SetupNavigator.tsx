import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GetPrograms} from '../redux/selectors';
import {useAppSelector} from '../redux/store';
import ProgramSelectionScreen from '../screens/setup/ProgramSelectionScreen';
import ShiftSetupScreen from '../screens/setup/ShiftSetupScreen';
import {theme} from '../theme';

export type SetupStackParamList = {
  ProgramSelection: undefined;
  ShiftSetup: undefined;
};

const Stack = createNativeStackNavigator<SetupStackParamList>();

// Two-step post-login setup: pick a program (only when 2+), then configure the
// shift. Single-program users start straight at ShiftSetup. Arriving here from
// "Change Shift Type" skips to ShiftSetup, since the program isn't changing.
const SetupNavigator: React.FC = () => {
  const programs = GetPrograms();
  const setupIntent = useAppSelector(state => state.ui.setupIntent);
  const initialRoute =
    setupIntent === 'shift_type' || programs.length <= 1
      ? 'ShiftSetup'
      : 'ProgramSelection';

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
