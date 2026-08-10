import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {FixtureStackParamList} from './routes';
import FixtureScreen from './FixtureScreen';
import CreateFixtureScreen from './CreateFixtureScreen';
import ViewFixtureScreen from './ViewFixtureScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<FixtureStackParamList>();

type CreateProps = NativeStackScreenProps<FixtureStackParamList, 'FixtureCreate'>;
type ViewProps = NativeStackScreenProps<FixtureStackParamList, 'FixtureView'>;

/**
 * Create and View still take onClose/onCreated/onDeleted callbacks, so these
 * adapters translate navigation into them rather than rewriting two working
 * screens. The forms stay unaware they live in a stack.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  return (
    <CreateFixtureScreen
      onClose={() => {
        navigation.popTo('FixtureList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={created => {
        // Submitting keeps them here: the toast's View action opens the new
        // record, which only exists on this tab.
        navigation.popTo('FixtureList', {
          toast: created.queued
            ? {
                title: 'Saved — will upload when back online',
                message:
                  "This fixture is queued and will upload automatically once you're back online.",
                routeId: '',
                variant: 'danger',
              }
            : {
                title: 'Fixture submitted',
                message: `${created.reference} was added to your Work Log.`,
                routeId: created.id,
              },
        });
      }}
    />
  );
};

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => {
  return (
    <ViewFixtureScreen
      id={route.params.id}
      onClose={() => navigation.popTo('FixtureList')}
      onDeleted={reference => {
        navigation.popTo('FixtureList', {
          toast: {
            title: 'Fixture deleted',
            message: `${reference} was removed from your Work Log.`,
            routeId: '',
            variant: 'danger',
          },
        });
      }}
    />
  );
};

const FixtureNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      // Every route here used to be local state inside one component — an
      // instant swap, no motion. The default push slide takes ~300ms, long
      // enough to see this stack's flat contentStyle before the destination
      // screen's own background (several use an SVG-gradient ScreenBackground
      // that needs a frame to paint) catches up — a visible gray flash that
      // never existed pre-navigation-stack. `animation: 'none'` restores the
      // original instant feel.
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="FixtureList" component={FixtureScreen} />
    <Stack.Screen name="FixtureCreate" component={CreateRoute} />
    <Stack.Screen name="FixtureView" component={ViewRoute} />
  </Stack.Navigator>
);

export default FixtureNavigator;
