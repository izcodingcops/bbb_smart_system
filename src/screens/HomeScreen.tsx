import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import ScreenBackground from '../components/ScreenBackground';
import BellIcon from '../components/icons/BellIcon';
import PlusIcon from '../components/icons/PlusIcon';
import {locationTracker} from '../utils/locationTracker';
import {useAuth} from '../hooks/useAuth';
import {useAppDispatch} from '../redux/store';
import {endShift} from '../redux/shift/slice';
import {GetActiveProgram, GetShiftTypes} from '../redux/auth/selectors';
import {
  GetActiveShiftTypeId,
  GetShiftStartTime,
  GetShiftStopTime,
} from '../redux/shift/selectors';
import {MOCK_QUICK_ACTIONS, MOCK_WORK_ITEMS} from '../constants';
import {WorkItem, WorkBucket, WorkStatus, WorkPriority} from '../types/work';
import {theme} from '../theme';

const SHIFT_MS = 8 * 3600 * 1000;

// Placeholder — wire to the real sync-queue length once exposed by the tracker.
const PENDING_COUNT = 7;

const pad = (n: number) => n.toString().padStart(2, '0');

const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const formatHm = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
};

const formatTimeOfDay = (d: Date): string =>
  d.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});

const STATUS_STYLE: Record<WorkStatus, {bg: string; fg: string}> = {
  Open: {bg: '#EEF1F4', fg: '#5B5F66'},
  'In-progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

const PRIORITY_COLOR: Record<WorkPriority, string> = {
  High: '#DC2626',
  Medium: '#D97706',
  Low: '#16A34A',
};

const HomeScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const dispatch = useAppDispatch();
  const program = GetActiveProgram();
  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const startIso = GetShiftStartTime();
  const stopIso = GetShiftStopTime();

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const shiftName =
    shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';
  const startDate = startIso ? new Date(startIso) : new Date();
  const totalMs = stopIso
    ? new Date(stopIso).getTime() - startDate.getTime()
    : SHIFT_MS;

  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const [pausedAccum, setPausedAccum] = useState(0);
  const [pauseStart, setPauseStart] = useState<number | null>(null);
  const [tab, setTab] = useState<WorkBucket>('assigned');
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [cardSize, setCardSize] = useState({w: 0, h: 0});

  useEffect(() => {
    if (paused) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const removeComplete = locationTracker.onUploadComplete(() => {
      setRefreshing(false);
    });
    return removeComplete;
  }, []);

  useEffect(() => {
    let mounted = true;
    locationTracker.getConnectivityStatus().then(online => {
      if (mounted) {
        setIsOnline(online);
      }
    });
    const removeConnectivity = locationTracker.onConnectivityChange(online =>
      setIsOnline(online),
    );
    return () => {
      mounted = false;
      removeConnectivity();
    };
  }, []);


  const effectiveNow = paused && pauseStart ? pauseStart : now;
  const elapsedMs = effectiveNow - startDate.getTime() - pausedAccum;
  const remainingMs = totalMs - elapsedMs;
  const progress = Math.max(0, Math.min(1, elapsedMs / totalMs));

  const toggleBreak = () => {
    if (paused && pauseStart) {
      setPausedAccum(a => a + (Date.now() - pauseStart));
      setPauseStart(null);
      setPaused(false);
    } else {
      setPauseStart(Date.now());
      setPaused(true);
    }
  };

  const handleEnd = () => {
    Alert.alert('End shift', 'Are you sure you want to end your shift?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'End shift', style: 'destructive', onPress: () => dispatch(endShift())},
    ]);
  };

  const handleAvatar = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log out', style: 'destructive', onPress: () => logout()},
    ]);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    locationTracker.syncNow();
  }, []);

  const workItems = MOCK_WORK_ITEMS as WorkItem[];
  const assignedCount = workItems.filter(w => w.bucket === 'assigned').length;
  const completedCount = workItems.filter(w => w.bucket === 'completed').length;
  const visibleWork = workItems.filter(w => w.bucket === tab);

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.programName} numberOfLines={1}>
                {program?.name ?? 'Your program'}
              </Text>
              <View style={styles.shiftMetaRow}>
                <View style={styles.greenDot} />
                <Text style={styles.shiftMeta}>{shiftName} · Day Shift</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
              <BellIcon size={22} color="#181B1F" />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>7</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              activeOpacity={0.8}
              onPress={handleAvatar}>
              {user?.avatar ? (
                <Image source={{uri: user.avatar}} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetRow}>
            <Text style={styles.greeting}>Welcome back, {firstName} 👋</Text>
            <View style={styles.onlinePill}>
              <View style={[styles.greenDot, !isOnline && styles.grayDot]} />
              <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          {/* Shift card */}
          <View style={styles.shiftCardShadow}>
          <LinearGradient
            colors={['#1E72C4', '#0A5AAB']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.shiftCard}
            onLayout={e =>
              setCardSize({
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              })
            }>
            {cardSize.w > 0 ? (
              <Svg
                width={cardSize.w}
                height={cardSize.h}
                style={StyleSheet.absoluteFill}
                pointerEvents="none">
                <Defs>
                  <RadialGradient
                    id="shiftGlowA"
                    cx={cardSize.w * 0.2}
                    cy={cardSize.h * 0.05}
                    r={cardSize.w * 0.5}
                    gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                  </RadialGradient>
                  <RadialGradient
                    id="shiftGlowB"
                    cx={cardSize.w * 0.92}
                    cy={cardSize.h * 0.95}
                    r={cardSize.w * 0.42}
                    gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect
                  width={cardSize.w}
                  height={cardSize.h}
                  fill="url(#shiftGlowA)"
                />
                <Rect
                  width={cardSize.w}
                  height={cardSize.h}
                  fill="url(#shiftGlowB)"
                />
              </Svg>
            ) : null}
            <View style={styles.shiftCardInner}>
            <View style={styles.shiftTop}>
              <View style={styles.shiftChip}>
                <View style={styles.greenDot} />
                <Text style={styles.shiftChipText} numberOfLines={1}>
                  {paused ? 'On Break' : shiftName}
                </Text>
              </View>
              <View style={styles.shiftBtns}>
                <TouchableOpacity
                  style={styles.breakBtn}
                  activeOpacity={0.85}
                  onPress={toggleBreak}>
                  <Text style={styles.breakText}>
                    {paused ? 'Resume' : 'Break'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.endBtn}
                  activeOpacity={0.85}
                  onPress={handleEnd}>
                  <Text style={styles.endText}>End</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.timer}>{formatClock(elapsedMs)}</Text>
            <Text style={styles.shiftStarted}>
              Shift Started today · {formatTimeOfDay(startDate)}
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${progress * 100}%`}]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                {formatHm(elapsedMs)} elapsed
              </Text>
              <Text style={styles.progressLabel}>
                {formatHm(remainingMs)} left
              </Text>
            </View>
            </View>
          </LinearGradient>
          </View>

          {/* Offline notice */}
          {!isOnline ? (
            <View style={styles.offlineCard}>
              <View style={styles.offlineIcon} />
              <View style={styles.flex}>
                <Text style={styles.offlineTitle}>It seems you're offline</Text>
                <Text style={styles.offlineBody}>
                  Work will sync automatically once you're online.
                </Text>
              </View>
              <View style={styles.pendingPill}>
                <Text style={styles.pendingText}>{PENDING_COUNT} Pending</Text>
              </View>
            </View>
          ) : null}

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}>
            {MOCK_QUICK_ACTIONS.map(a => (
              <TouchableOpacity
                key={a.id}
                style={styles.quickCard}
                activeOpacity={0.85}>
                <View style={[styles.quickIcon, {backgroundColor: a.tint}]} />
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recent work */}
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Work</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === 'assigned' && styles.tabActive]}
              activeOpacity={0.8}
              onPress={() => setTab('assigned')}>
              <Text
                style={[
                  styles.tabText,
                  tab === 'assigned' && styles.tabTextActive,
                ]}>
                Assigned Work
              </Text>
              <View
                style={[styles.tabCount, tab === 'assigned' && styles.tabCountActive]}>
                <Text
                  style={[
                    styles.tabCountText,
                    tab === 'assigned' && styles.tabCountTextActive,
                  ]}>
                  {assignedCount}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'completed' && styles.tabActive]}
              activeOpacity={0.8}
              onPress={() => setTab('completed')}>
              <Text
                style={[
                  styles.tabText,
                  tab === 'completed' && styles.tabTextActive,
                ]}>
                Completed Work
              </Text>
              <View
                style={[
                  styles.tabCount,
                  tab === 'completed' && styles.tabCountActive,
                ]}>
                <Text
                  style={[
                    styles.tabCountText,
                    tab === 'completed' && styles.tabCountTextActive,
                  ]}>
                  {completedCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {visibleWork.map(item => (
            <WorkCard key={item.id} item={item} />
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <PlusIcon size={26} color={theme.colors.white} />
        </TouchableOpacity>
      </SafeAreaView>
    </ScreenBackground>
  );
};

const WorkCard: React.FC<{item: WorkItem}> = ({item}) => {
  const status = STATUS_STYLE[item.status];
  return (
    <View style={styles.workCard}>
      <View style={styles.workTopRow}>
        <View style={styles.workIdRow}>
          <Text style={styles.workId}>{item.id}</Text>
          <Text style={styles.workCategory}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: status.bg}]}>
          <Text style={[styles.statusText, {color: status.fg}]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.workDate}>{item.date}</Text>

      <View style={styles.workDivider} />

      <View style={styles.workMetaRow}>
        <View style={styles.workMetaCol}>
          <Text style={styles.workMetaLabel}>Type</Text>
          <Text style={styles.workMetaValue}>{item.type}</Text>
        </View>
        <View style={styles.workMetaCol}>
          <Text style={styles.workMetaLabel}>Priority</Text>
          <Text
            style={[styles.workMetaValue, {color: PRIORITY_COLOR[item.priority]}]}>
            {item.priority}
          </Text>
        </View>
        <View style={styles.workMetaCol}>
          <Text style={styles.workMetaLabel}>Assigned To</Text>
          <View style={styles.assigneeRow}>
            <View style={styles.assigneeAvatar}>
              <Text style={styles.assigneeInitials}>{item.assigneeInitials}</Text>
            </View>
            <Text style={styles.assigneeName} numberOfLines={1}>
              {item.assignee}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.workMetaLabel}>Address</Text>
      <Text style={styles.workAddress}>{item.address}</Text>
    </View>
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
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm},
  programName: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    color: '#181B1F',
  },
  shiftMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  greenDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A'},
  grayDot: {backgroundColor: theme.colors.textMuted},
  shiftMeta: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontFamily: theme.fonts.black,
    fontSize: 10,
    color: theme.colors.white,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {width: 44, height: 44},
  avatarInitial: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    color: theme.colors.white,
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  greeting: {
    fontFamily: theme.fonts.black,
    fontSize: 22,
    letterSpacing: -0.4,
    color: '#181B1F',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...theme.shadow.card,
  },
  onlineText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: '#16A34A',
  },
  offlineText: {color: theme.colors.textSecondary},
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadow.card,
  },
  offlineIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: '#E6E9ED',
  },
  offlineTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: '#181B1F',
    marginBottom: 2,
  },
  offlineBody: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  pendingPill: {
    backgroundColor: '#F1F3F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pendingText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  shiftCardShadow: {
    borderRadius: 20,
    shadowColor: '#0A5AAB',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  shiftCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  shiftCardInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  shiftTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  shiftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shiftChipText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.white,
    flexShrink: 1,
  },
  shiftBtns: {flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0},
  breakBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  breakText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.white,
  },
  endBtn: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.white,
  },
  endText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
  timer: {
    fontFamily: theme.fonts.black,
    fontSize: 40,
    letterSpacing: 1,
    color: theme.colors.white,
  },
  shiftStarted: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    marginBottom: theme.spacing.xl,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.white,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  progressLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    color: '#181B1F',
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.md,
  },
  quickRow: {gap: theme.spacing.md, paddingRight: theme.spacing.md},
  quickCard: {
    width: 128,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  quickLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: '#181B1F',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.md,
  },
  viewAll: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
  tabs: {flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md},
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
  },
  tabActive: {backgroundColor: '#E6F4FF'},
  tabText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {color: theme.colors.primary, fontFamily: theme.fonts.black},
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF1F4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabCountActive: {backgroundColor: theme.colors.primary},
  tabCountText: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  tabCountTextActive: {color: theme.colors.white},
  workCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  workTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workIdRow: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  workId: {
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    color: '#181B1F',
  },
  workCategory: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statusBadge: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5},
  statusText: {fontFamily: theme.fonts.black, fontSize: 12},
  workDate: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  workDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  workMetaRow: {flexDirection: 'row', marginBottom: theme.spacing.md},
  workMetaCol: {flex: 1},
  workMetaLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 11.5,
    color: theme.colors.textMuted,
    marginBottom: 3,
  },
  workMetaValue: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: '#20242A',
  },
  assigneeRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  assigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitials: {
    fontFamily: theme.fonts.black,
    fontSize: 9,
    color: theme.colors.white,
  },
  assigneeName: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: '#20242A',
    flex: 1,
  },
  workAddress: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: '#20242A',
    marginTop: 2,
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
