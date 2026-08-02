import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, RefreshControl, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import GradientFab from '../../components/ui/GradientFab';
import HomeHeader from './components/HomeHeader';
import ShiftTimerCard from './components/ShiftTimerCard';
import OfflineNotice from './components/OfflineNotice';
import QuickActions from './components/QuickActions';
import RecentWork from './components/RecentWork';
import CheckedInEquipment from './components/CheckedInEquipment';
import {locationTracker} from '../../utils/locationTracker';
import {useAuth} from '../../hooks/useAuth';
import {useAppDispatch} from '../../redux/store';
import {SCREEN} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
import {endShift} from '../../redux/shift/slice';
import {requestScreen} from '../../redux/ui/slice';
import {GetActiveProgram, GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {
  useGetQuickActionsQuery,
  useGetWorkItemsQuery,
} from '../../graphql/features/work/hooks';
import {useGetCheckedInEquipmentQuery} from '../../graphql/features/equipment/hooks';
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

  const {
    data: workItems = [],
    isLoading: isWorkLoading,
    refetch: refetchWork,
  } = useGetWorkItemsQuery();
  const {data: quickActions = [], isLoading: isQuickActionsLoading} =
    useGetQuickActionsQuery();
  const {
    data: equipment = [],
    isLoading: isEquipmentLoading,
    refetch: refetchEquipment,
  } = useGetCheckedInEquipmentQuery();

  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.home);

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

  const handleAddRequest = useCallback(
    (tileId: string) => {
      setAddOpen(false);
      queueTile(tileId);
    },
    [queueTile],
  );

  // Placeholder — the checkout flow has no screen yet.
  const handleCheckout = useCallback((item: EquipmentItem) => {
    Alert.alert('Coming soon', `Checking out ${item.name} is not wired up yet.`);
  }, []);

  const handleViewAllWork = useCallback(() => {
    dispatch(requestScreen(SCREEN.work));
  }, [dispatch]);

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

          <QuickActions actions={quickActions} isLoading={isQuickActionsLoading} />

          <RecentWork
            items={workItems}
            isLoading={isWorkLoading}
            onViewAll={handleViewAllWork}
          />

          <CheckedInEquipment
            items={equipment}
            isLoading={isEquipmentLoading}
            onCheckout={handleCheckout}
          />
        </ScrollView>

        <GradientFab onPress={() => setAddOpen(true)} />

        <AddRequestsSheet
          visible={addOpen}
          shiftName={shiftName}
          onSelect={handleAddRequest}
          onClose={() => setAddOpen(false)}
          onClosed={flushTile}
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
});

export default HomeScreen;
