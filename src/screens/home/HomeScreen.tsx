import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, RefreshControl, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import ScreenBackground from '../../components/ScreenBackground';
import AddRequestsSheet from '../../components/AddRequestsSheet';
import GradientFab from '../../components/ui/GradientFab';
import AssigneeSheet from '../maintenance/components/AssigneeSheet';
import HomeHeader from './components/HomeHeader';
import ShiftTimerCard from './components/ShiftTimerCard';
import OfflineNotice from './components/OfflineNotice';
import QuickActions from './components/QuickActions';
import RecentWork from './components/RecentWork';
import CheckedInEquipment from './components/CheckedInEquipment';
import {locationTracker} from '../../utils/locationTracker';
import {connectivity} from '../../graphql/offlineQueue/connectivity';
import {useAuth} from '../../hooks/useAuth';
import {useAppDispatch} from '../../redux/store';
import {SCREEN, TabNavigation} from '../../navigation/screens';
import {useAddRequestTiles} from '../../hooks/useAddRequestTiles';
import {endShift} from '../../redux/shift/slice';
import {GetActiveProgram, GetShiftTypes} from '../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../redux/shift/selectors';
import {
  GetFailedOutboxItems,
  GetOutboxItems,
} from '../../redux/outbox/selectors';
import {
  useGetQuickActionsQuery,
  useGetWorkItemsQuery,
  useSetWorkItemStatusMutation,
} from '../../graphql/features/work/hooks';
import {useGetCheckedInEquipmentQuery} from '../../graphql/features/equipment/hooks';
import {useUnreadNotificationCountQuery} from '../../graphql/features/notification/hooks';
import {EquipmentItem} from '../../types/equipment';
import {WorkItem, WorkStatus} from '../../types/work';
import {HomeStackParamList} from './routes';
import {theme} from '../../theme';

type HomeNavigation = NativeStackNavigationProp<
  HomeStackParamList,
  'HomeMain'
>;

/** Maps a Work item's category to the kind HomeRecordView already switches on. */
const RECORD_KIND: Partial<Record<WorkItem['category'], 'Maintenance' | 'Fixture' | 'WorkLog'>> = {
  Maintenance: 'Maintenance',
  Fixture: 'Fixture',
  Activity: 'WorkLog',
};

const HomeScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const dispatch = useAppDispatch();
  const program = GetActiveProgram();
  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const outboxItems = GetOutboxItems();
  const failedItems = GetFailedOutboxItems();

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
  const {data: unreadNotifications = 0} = useUnreadNotificationCountQuery();
  const {mutate: setWorkItemStatus} = useSetWorkItemStatusMutation();

  const navigation = useNavigation<HomeNavigation>();
  // "View all work" crosses to another tab, which only the parent can do.
  const tabNavigation =
    navigation.getParent<TabNavigation>();
  const [refreshing, setRefreshing] = useState(false);
  // Single source of truth for "are we online" app-wide — see connectivity.ts.
  // This used to read a separate native NWPathMonitor signal via
  // locationTracker, which could disagree with NetInfo (the signal the
  // offline mutation queue actually obeys) and was unreliable in the iOS
  // Simulator when toggling the host Mac's network.
  const [isOnline, setIsOnline] = useState(() => connectivity.isOnline());
  const [addOpen, setAddOpen] = useState(false);
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<WorkItem | null>(null);
  const {queueTile, flushTile} = useAddRequestTiles(SCREEN.home);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const shiftName = shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';

  useEffect(() => {
    const removeComplete = locationTracker.onUploadComplete(() =>
      setRefreshing(false),
    );
    return removeComplete;
  }, []);

  useEffect(() => connectivity.onChange(setIsOnline), []);

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

  const handleNotifications = useCallback(() => {
    navigation.navigate('HomeNotifications');
  }, [navigation]);

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
    tabNavigation?.navigate(SCREEN.work);
  }, [tabNavigation]);

  const handleToggleMenu = useCallback((cardId: string) => {
    setMenuItemId(current => (current === cardId ? null : cardId));
  }, []);

  const handleSelectStatus = useCallback(
    async (item: WorkItem, status: WorkStatus) => {
      setMenuItemId(null);
      try {
        await setWorkItemStatus(item.id, status);
      } catch {
        Alert.alert(
          "Couldn't update status",
          `${item.reference} is unchanged. Check your connection and try again.`,
        );
      }
    },
    [setWorkItemStatus],
  );

  const handleOpenItem = useCallback(
    (item: WorkItem) => {
      const kind = RECORD_KIND[item.category];
      if (!kind) {
        Alert.alert(item.reference, `${item.category} detail view is coming soon.`);
        return;
      }
      navigation.navigate('HomeRecordView', {kind, id: item.id});
    },
    [navigation],
  );

  const handleOpenAssign = useCallback((item: WorkItem) => {
    setAssignTarget(item);
  }, []);

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
            notificationCount={unreadNotifications}
            isOnline={isOnline}
            onNotificationsPress={handleNotifications}
            onAvatarPress={handleAvatar}
          />

          <ShiftTimerCard shiftName={shiftName} onEnd={handleEnd} />

          {!isOnline ? (
            <OfflineNotice
              pendingCount={outboxItems.length}
              failedCount={failedItems.length}
            />
          ) : null}

          <QuickActions actions={quickActions} isLoading={isQuickActionsLoading} />

          <RecentWork
            items={workItems}
            isLoading={isWorkLoading}
            onViewAll={handleViewAllWork}
            onOpenItem={handleOpenItem}
            menuItemId={menuItemId}
            onToggleMenu={handleToggleMenu}
            onSelectStatus={handleSelectStatus}
            onOpenAssign={handleOpenAssign}
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

        <AssigneeSheet
          target={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => {
            refetchWork();
          }}
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
