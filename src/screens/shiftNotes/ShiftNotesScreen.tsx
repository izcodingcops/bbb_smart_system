import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../../components/ScreenBackground';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {EmptyState, GradientFab, Toast} from '../../components/ui';
import {FileTextIcon} from '../../components/icons';
import {ShiftNotesStackParamList, ShiftNoteToast} from './routes';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {SCREEN} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  ShiftNotesStackParamList,
  'ShiftNotesList'
>;

/**
 * The module's tab root. There is nothing to list: shared notes are read back
 * on the portal, not in the app, so this screen exists to say so and to start a
 * new one.
 *
 * It runs no query, so it has no loading, error or refetch state.
 */
const ShiftNotesScreen: React.FC = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<ShiftNoteToast | null>(null);
  const navigation = useNavigation<ListNavigation>();
  const route =
    useRoute<RouteProp<ShiftNotesStackParamList, 'ShiftNotesList'>>();
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.shiftNotes);

  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();

  // Create hands a toast back on the way out — show it once, then clear the
  // param so returning here later doesn't replay it.
  const incomingToast = route.params?.toast;
  useEffect(() => {
    if (!incomingToast) return;
    setToast(incomingToast);
    navigation.setParams({toast: undefined});
  }, [incomingToast, navigation]);

  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Shift Notes</Text>
      </SafeAreaView>

      <View style={styles.body}>
        <EmptyState
          icon={<FileTextIcon size={31} color={theme.colors.primary} />}
          title="Brief notes go straight to the team"
          body="Shift notes aren’t listed in the app — once shared they land on the recipients’ devices and on your portal. Send a new brief whenever the team needs context before a shift."
          actionLabel="Create a shift note"
          onAction={() => navigation.navigate('ShiftNotesCreate')}
        />
      </View>

      <GradientFab onPress={() => setAddOpen(true)} />

      <AddRequestsSheet
        visible={addOpen}
        shiftName={shiftName}
        onSelect={tileId => {
          setAddOpen(false);
          queueTile(tileId);
        }}
        onClose={() => setAddOpen(false)}
        onClosed={flushTile}
      />

      {/* No action: there is nowhere in the app to read a shared note back. */}
      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 26,
    letterSpacing: -0.6,
    color: '#181B1F',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  body: {flex: 1},
});

export default ShiftNotesScreen;
