import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {ShiftNotesStackParamList} from './routes';
import ShiftNotesScreen from './ShiftNotesScreen';
import ShiftNotesCreateScreen from './ShiftNotesCreateScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<ShiftNotesStackParamList>();

type CreateProps = NativeStackScreenProps<
  ShiftNotesStackParamList,
  'ShiftNotesCreate'
>;

/**
 * The create screen takes onClose/onCreated callbacks, so this adapter
 * translates navigation into them — the form stays unaware it lives in a
 * stack, matching every other module.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  return (
    <ShiftNotesCreateScreen
      onClose={() => {
        navigation.popTo('ShiftNotesList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={created => {
        navigation.popTo('ShiftNotesList', {
          toast: {
            title: 'Brief note shared successfully',
            message: `Shared with ${created.recipients}.`,
          },
        });
      }}
    />
  );
};

const ShiftNotesNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="ShiftNotesList" component={ShiftNotesScreen} />
    <Stack.Screen name="ShiftNotesCreate" component={CreateRoute} />
  </Stack.Navigator>
);

export default ShiftNotesNavigator;
