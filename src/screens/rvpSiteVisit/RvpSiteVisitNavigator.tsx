import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {RvpSiteVisitStackParamList} from './routes';
import RvpSiteVisitScreen from './RvpSiteVisitScreen';
import CreateRvpSiteVisitScreen from './CreateRvpSiteVisitScreen';
import ViewRvpSiteVisitScreen from './ViewRvpSiteVisitScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<RvpSiteVisitStackParamList>();

type CreateProps = NativeStackScreenProps<
  RvpSiteVisitStackParamList,
  'RvpSiteVisitCreate'
>;
type ViewProps = NativeStackScreenProps<
  RvpSiteVisitStackParamList,
  'RvpSiteVisitView'
>;

/**
 * Create and View take onClose/onCreated/onDeleted rather than knowing they
 * live in a stack, so these adapters translate navigation into them.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  return (
    <CreateRvpSiteVisitScreen
      onClose={() => {
        navigation.popTo('RvpSiteVisitList');
        // Closed unsaved and the create was asked for from another tab, so the
        // trip into this module never really happened — go back where it
        // started from.
        if (origin) {
          navigation.getParent()?.navigate(origin as never);
        }
      }}
      onCreated={created => {
        // Submitting keeps them here: the toast's View action opens the new
        // report, which only exists on this tab.
        navigation.popTo('RvpSiteVisitList', {
          toast: {
            title: 'Site visit report submitted',
            message: `${created.reference} was filed with a score of ${created.score}.`,
            routeId: created.id,
          },
        });
      }}
    />
  );
};

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewRvpSiteVisitScreen
    id={route.params.id}
    onClose={() => navigation.popTo('RvpSiteVisitList')}
    onDeleted={reference => {
      navigation.popTo('RvpSiteVisitList', {
        toast: {
          title: 'Report deleted',
          message: `${reference} was removed, and the Operations Manager has been notified.`,
          routeId: '',
          variant: 'danger',
        },
      });
    }}
  />
);

const RvpSiteVisitNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="RvpSiteVisitList" component={RvpSiteVisitScreen} />
    <Stack.Screen name="RvpSiteVisitCreate" component={CreateRoute} />
    <Stack.Screen name="RvpSiteVisitView" component={ViewRoute} />
  </Stack.Navigator>
);

export default RvpSiteVisitNavigator;
