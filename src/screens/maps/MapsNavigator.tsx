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
    <Stack.Screen name="MapsList" component={MapsScreen} />
    <Stack.Screen name="MapsDownload" component={DownloadRoute} />
  </Stack.Navigator>
);

export default MapsNavigator;
