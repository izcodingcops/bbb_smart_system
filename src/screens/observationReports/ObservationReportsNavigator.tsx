import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {ObservationReportsStackParamList} from './routes';
import ObservationReportsScreen from './ObservationReportsScreen';
import CreateObservationReportScreen from './CreateObservationReportScreen';
import ViewObservationReportScreen from './ViewObservationReportScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<ObservationReportsStackParamList>();

type CreateProps = NativeStackScreenProps<
  ObservationReportsStackParamList,
  'ObservationReportsCreate'
>;
type ViewProps = NativeStackScreenProps<ObservationReportsStackParamList, 'ObservationReportsView'>;

/**
 * Create and View take onClose/onCreated/onDeleted rather than knowing they
 * live in a stack, so these adapters translate navigation into them.
 */
const CreateRoute: React.FC<CreateProps> = ({navigation, route}) => {
  const origin = route.params?.origin;
  return (
    <CreateObservationReportScreen
      onClose={() => {
        navigation.popTo('ObservationReportsList');
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
        navigation.popTo('ObservationReportsList', {
          toast: {
            title: 'Observation submitted',
            message: `${created.reference} was added to Observation Reports with a score of ${created.score}.`,
            routeId: created.id,
          },
        });
      }}
    />
  );
};

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewObservationReportScreen
    id={route.params.id}
    onClose={() => navigation.popTo('ObservationReportsList')}
    onDeleted={reference => {
      navigation.popTo('ObservationReportsList', {
        toast: {
          title: 'Report deleted',
          message: `${reference} was removed, and the person observed has been notified.`,
          routeId: '',
          variant: 'danger',
        },
      });
    }}
  />
);

const ObservationReportsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="ObservationReportsList" component={ObservationReportsScreen} />
    <Stack.Screen name="ObservationReportsCreate" component={CreateRoute} />
    <Stack.Screen name="ObservationReportsView" component={ViewRoute} />
  </Stack.Navigator>
);

export default ObservationReportsNavigator;
