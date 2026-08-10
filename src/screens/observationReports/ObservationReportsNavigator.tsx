import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {ObservationReportsStackParamList} from './routes';
import ObservationReportsScreen from './ObservationReportsScreen';
import ViewObservationReportScreen from './ViewObservationReportScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<ObservationReportsStackParamList>();

type ViewProps = NativeStackScreenProps<ObservationReportsStackParamList, 'ObservationReportsView'>;

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewObservationReportScreen
    id={route.params.id}
    onClose={() => navigation.popTo('ObservationReportsList')}
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
    <Stack.Screen name="ObservationReportsView" component={ViewRoute} />
  </Stack.Navigator>
);

export default ObservationReportsNavigator;
