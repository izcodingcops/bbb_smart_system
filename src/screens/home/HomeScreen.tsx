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
import {PlusIcon} from '../../components/icons';
import HomeHeader from './components/HomeHeader';
import ShiftTimerCard from './components/ShiftTimerCard';
import OfflineNotice from './components/OfflineNotice';
import QuickActions from './components/QuickActions';
import RecentWork from './components/RecentWork';
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

  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchWork();
    locationTracker.syncNow();
  }, [refetchWork]);

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
        </ScrollView>

        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <PlusIcon size={26} color={theme.colors.white} />
        </TouchableOpacity>
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
