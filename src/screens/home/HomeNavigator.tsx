import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {HomeStackParamList} from './routes';
import HomeScreen from './HomeScreen';
import NotificationsScreen from '../notifications/NotificationsScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

type NotificationsProps = NativeStackScreenProps<
  HomeStackParamList,
  'HomeNotifications'
>;

/**
 * NotificationsScreen still takes an onClose callback, so this adapter
 * translates navigation into it rather than rewriting a working screen.
 */
const NotificationsRoute: React.FC<NotificationsProps> = ({navigation}) => {
  return <NotificationsScreen onClose={() => navigation.popTo('HomeMain')} />;
};

const HomeNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="HomeNotifications" component={NotificationsRoute} />
  </Stack.Navigator>
);

export default HomeNavigator;
