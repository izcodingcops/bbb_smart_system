import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {OffHoursVisitStackParamList} from './routes';
import OffHoursVisitScreen from './OffHoursVisitScreen';
import OffHoursVisitCreateScreen from './OffHoursVisitCreateScreen';
import {useAppDispatch} from '../../redux/store';
import {showGlobalToast} from '../../redux/ui/slice';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<OffHoursVisitStackParamList>();

type CreateProps = NativeStackScreenProps<
  OffHoursVisitStackParamList,
  'OffHoursVisitCreate'
>;

/**
 * The create screen takes onClose/onCreated callbacks, so this adapter
 * translates navigation into them — the form stays unaware it lives in a
 * stack, matching every other module.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  const dispatch = useAppDispatch();
  return (
    <OffHoursVisitCreateScreen
      onClose={() => {
        navigation.popTo('OffHoursVisitList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={() => {
        if (origin) {
          // Leaving the tab entirely, so the List screen's own toast (tied to
          // its route params) would never be seen — show it globally instead
          // and return to wherever the create was actually opened from,
          // rather than stranding the user on this tab's empty state.
          dispatch(
            showGlobalToast({
              title: 'Off Hours Visit report saved successfully',
              message: 'You can view it on your portal.',
            }),
          );
          navigation.popTo('OffHoursVisitList');
          navigation.getParent()?.navigate(origin as never);
        } else {
          navigation.popTo('OffHoursVisitList', {
            toast: {
              title: 'Off Hours Visit report saved successfully',
              message: 'You can view it on your portal.',
            },
          });
        }
      }}
    />
  );
};

const OffHoursVisitNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="OffHoursVisitList" component={OffHoursVisitScreen} />
    <Stack.Screen name="OffHoursVisitCreate" component={CreateRoute} />
  </Stack.Navigator>
);

export default OffHoursVisitNavigator;
