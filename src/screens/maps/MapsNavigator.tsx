import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {MapsStackParamList} from './routes';
import MapsScreen from './MapsScreen';
import DownloadMapScreen from './DownloadMapScreen';
import {GetDownloadedMaps} from '../../redux/maps/selectors';
import {mapDownloaded} from '../../redux/maps/slice';
import {useAppDispatch} from '../../redux/store';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<MapsStackParamList>();

type DownloadProps = NativeStackScreenProps<
  MapsStackParamList,
  'MapsDownload'
>;

/**
 * DownloadMapScreen still takes onClose/onSaved callbacks and the existing
 * saved maps as a prop, so this adapter supplies them from the store rather
 * than rewriting the save flow.
 */
const DownloadRoute: React.FC<DownloadProps> = ({navigation, route}) => {
  const items = GetDownloadedMaps();
  const dispatch = useAppDispatch();
  return (
    <DownloadMapScreen
      initialCoordinate={route.params?.initialCoordinate ?? null}
      existing={items}
      onClose={() => navigation.popTo('MapsList')}
      onSaved={record => {
        dispatch(mapDownloaded(record));
        navigation.popTo('MapsList', {savedName: record.name});
      }}
    />
  );
};

const MapsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="MapsList" component={MapsScreen} />
    <Stack.Screen name="MapsDownload" component={DownloadRoute} />
  </Stack.Navigator>
);

export default MapsNavigator;
