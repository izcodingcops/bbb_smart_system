import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {RvpSiteVisitStackParamList} from './routes';
import RvpSiteVisitScreen from './RvpSiteVisitScreen';
import ViewRvpSiteVisitScreen from './ViewRvpSiteVisitScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<RvpSiteVisitStackParamList>();

type ViewProps = NativeStackScreenProps<
  RvpSiteVisitStackParamList,
  'RvpSiteVisitView'
>;

/** The detail screen takes onClose rather than knowing it lives in a stack. */
const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewRvpSiteVisitScreen
    id={route.params.id}
    onClose={() => navigation.popTo('RvpSiteVisitList')}
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
    <Stack.Screen name="RvpSiteVisitView" component={ViewRoute} />
  </Stack.Navigator>
);

export default RvpSiteVisitNavigator;
