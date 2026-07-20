import React, {useCallback, useEffect, useState} from 'react';
import {
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import {PlusIcon} from '../../components/icons';
import HomeHeader from './components/HomeHeader';
import ShiftTimerCard from './components/ShiftTimerCard';
import OfflineNotice from './components/OfflineNotice';
import QuickActions from './components/QuickActions';
import RecentWork from './components/RecentWork';
import CheckedInEquipment from './components/CheckedInEquipment';
import {locationTracker} from '../../utils/locationTracker';
import {useAuth} from '../../hooks/useAuth';
import {useAppDispatch} from '../../redux/store';
import {endShift} from '../../redux/shift/slice';
import {GetActiveProgram, GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {
  useGetQuickActionsQuery,
  useGetWorkItemsQuery,
} from '../../redux/work/api';
import {useGetCheckedInEquipmentQuery} from '../../redux/equipment/api';
import {EquipmentItem} from '../../types/equipment';
import {theme} from '../../theme';

// Placeholder — wire to the real sync-queue length once exposed by the tracker.
const PENDING_COUNT = 7;
const NOTIFICATION_COUNT = 7;

const HomeScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const dispatch = useAppDispatch();
  const program = GetActiveProgram();
  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();

  const {data: workItems = [], refetch: refetchWork} = useGetWorkItemsQuery();
  const {data: quickActions = []} = useGetQuickActionsQuery();
  const {data: equipment = [], refetch: refetchEquipment} =
    useGetCheckedInEquipmentQuery();

  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [queuedTile, setQueuedTile] = useState<string | null>(null);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  useEffect(() => {
    const removeComplete = locationTracker.onUploadComplete(() =>
      setRefreshing(false),
    );
    return removeComplete;
  }, []);

  useEffect(() => {
    let mounted = true;
    locationTracker.getConnectivityStatus().then(online => {
      if (mounted) {
        setIsOnline(online);
      }
    });
    const removeConnectivity = locationTracker.onConnectivityChange(setIsOnline);
    return () => {
      mounted = false;
      removeConnectivity();
    };
  }, []);

  const handleEnd = useCallback(() => {
    Alert.alert('End shift', 'Are you sure you want to end your shift?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'End shift',
        style: 'destructive',
        onPress: () => dispatch(endShift()),
      },
    ]);
  }, [dispatch]);

  const handleAvatar = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log out', style: 'destructive', onPress: () => logout()},
    ]);
  }, [logout]);

  const handleAddRequest = useCallback((tileId: string) => {
    setAddOpen(false);
    setQueuedTile(tileId);
  }, []);

  // Placeholder — the checkout flow has no screen yet.
  const handleCheckout = useCallback((item: EquipmentItem) => {
    Alert.alert('Coming soon', `Checking out ${item.name} is not wired up yet.`);
  }, []);

  // Placeholder — none of the create/check-in flows have screens yet. Held
  // until the sheet's modal is gone, since iOS drops an alert presented while
  // another modal is still up.
  const handleAddClosed = useCallback(() => {
    if (queuedTile) {
      Alert.alert('Coming soon', `"${queuedTile}" is not wired up yet.`);
      setQueuedTile(null);
    }
  }, [queuedTile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchWork();
    refetchEquipment();
    locationTracker.syncNow();
  }, [refetchWork, refetchEquipment]);

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <HomeHeader
            programName={program?.name ?? 'Your program'}
            shiftName={shiftName}
            firstName={firstName}
            avatarUri={user?.avatar}
            notificationCount={NOTIFICATION_COUNT}
            isOnline={isOnline}
            onAvatarPress={handleAvatar}
          />

          <ShiftTimerCard shiftName={shiftName} onEnd={handleEnd} />

          {!isOnline ? <OfflineNotice pendingCount={PENDING_COUNT} /> : null}

          <QuickActions actions={quickActions} />

          <RecentWork items={workItems} />

          <CheckedInEquipment items={equipment} onCheckout={handleCheckout} />
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setAddOpen(true)}>
          <PlusIcon size={26} color={theme.colors.white} />
        </TouchableOpacity>

        <AddRequestsSheet
          visible={addOpen}
          shiftName={shiftName}
          onSelect={handleAddRequest}
          onClose={() => setAddOpen(false)}
          onClosed={handleAddClosed}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.fab,
  },
});

export default HomeScreen;
