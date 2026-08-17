import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../../components/ScreenBackground';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {EmptyState, GradientFab, Toast} from '../../components/ui';
import {ClockIcon} from '../../components/icons';
import {OffHoursVisitStackParamList, OffHoursVisitToast} from './routes';
import {GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {SCREEN} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
import {theme} from '../../theme';

type ListNavigation = NativeStackNavigationProp<
  OffHoursVisitStackParamList,
  'OffHoursVisitList'
>;

/**
 * The module's tab root. There is nothing to list: submitted visits are read
 * back on the portal, not in the app, so this screen exists to say so and to
 * start a new one.
 *
 * It runs no query, so it has no loading, error or refetch state.
 */
const OffHoursVisitScreen: React.FC = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<OffHoursVisitToast | null>(null);
  const navigation = useNavigation<ListNavigation>();
  const route =
    useRoute<RouteProp<OffHoursVisitStackParamList, 'OffHoursVisitList'>>();
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.offHoursVisit);

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
        <Text style={styles.title}>Off Hours Visit</Text>
      </SafeAreaView>

      <View style={styles.body}>
        <EmptyState
          icon={<ClockIcon size={31} color={theme.colors.primary} />}
          title="Off hours visits live on your portal"
          body="Submitted visit reports aren’t listed in the app — they’re sent straight to your portal for review. Record a new one whenever you walk a site outside standard hours."
          actionLabel="Record an off hours visit"
          onAction={() => navigation.navigate('OffHoursVisitCreate')}
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

      {/* No action: there is nowhere in the app to view a submitted visit. */}
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

export default OffHoursVisitScreen;
