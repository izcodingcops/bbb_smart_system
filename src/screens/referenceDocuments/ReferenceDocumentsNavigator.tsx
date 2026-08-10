import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {ReferenceDocumentsStackParamList} from './routes';
import ReferenceDocumentsScreen from './ReferenceDocumentsScreen';
import ViewReferenceDocumentScreen from './ViewReferenceDocumentScreen';
import {theme} from '../../theme';

const Stack = createNativeStackNavigator<ReferenceDocumentsStackParamList>();

type ViewProps = NativeStackScreenProps<ReferenceDocumentsStackParamList, 'ReferenceDocumentsView'>;

const ViewRoute: React.FC<ViewProps> = ({navigation, route}) => (
  <ViewReferenceDocumentScreen
    id={route.params.id}
    onClose={() => navigation.popTo('ReferenceDocumentsList')}
  />
);

const ReferenceDocumentsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'none',
      contentStyle: {backgroundColor: theme.colors.background},
    }}>
    <Stack.Screen name="ReferenceDocumentsList" component={ReferenceDocumentsScreen} />
    <Stack.Screen name="ReferenceDocumentsView" component={ViewRoute} />
  </Stack.Navigator>
);

export default ReferenceDocumentsNavigator;
