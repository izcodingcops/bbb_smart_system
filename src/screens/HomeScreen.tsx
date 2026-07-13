import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {locationTracker} from '../utils/locationTracker';
import {useAuth} from '../hooks/useAuth';
import {theme} from '../theme';
import PlusIcon from '../components/icons/PlusIcon';

const STAT_ICONS: Record<string, any> = {
  assigned: require('../assets/icons/stat_assigned.png'),
  unassign: require('../assets/icons/stat_unassign.png'),
  mywork: require('../assets/icons/stat_mywork.png'),
};

const StatCard = ({
  label,
  count,
  iconKey,
}: {
  label: string;
  count: number;
  iconKey: string;
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    <View style={styles.statRow}>
      <Text style={styles.statCount}>{count}</Text>
      <Image source={STAT_ICONS[iconKey]} style={styles.statIcon} />
    </View>
  </View>
);

const HomeScreen: React.FC = () => {
  const {logout} = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log out', style: 'destructive', onPress: () => logout()},
    ]);
  }, [logout]);

  useEffect(() => {
    const removeProgress = locationTracker.onUploadProgress(progress => {
      setSyncStatus(`Uploading… ${Math.round(progress)}%`);
    });
    const removeComplete = locationTracker.onUploadComplete(status => {
      setSyncStatus(status === 'completed' ? 'Sync complete' : 'Sync failed — will retry');
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    });
    return () => { removeProgress(); removeComplete(); };
  }, []);

  const handleSyncNow = useCallback(() => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('Syncing…');
    locationTracker.syncNow();
  }, [isSyncing]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={[theme.common.row, styles.headerInner]}>
          <View style={[theme.common.flex1, styles.headerTextCol]}>
            <View style={[theme.common.row, styles.gap4]}>
              <Image
                source={require('../assets/icons/marker_pin.png')}
                style={[styles.icon20, {tintColor: theme.colors.white}]}
              />
              <Text style={styles.programName} numberOfLines={1}>
                Akron Oh Downtown Akron Partnership 1350
              </Text>
            </View>
            <View style={[theme.common.row, styles.shiftRow]}>
              <Text style={styles.shiftLabel}>Shift Type:</Text>
              <Text style={styles.shiftLabel}>Cleaning</Text>
              <Image
                source={require('../assets/icons/chevron_left.png')}
                style={[styles.icon14, {tintColor: theme.colors.white}]}
              />
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8}>
              <PlusIcon size={20} color={theme.colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.8}
              onPress={handleLogout}>
              <Text style={styles.logoutIcon}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Image
            source={require('../assets/icons/search.png')}
            style={[styles.icon20, {tintColor: theme.colors.whiteMuted}]}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search here..."
            placeholderTextColor={theme.colors.whiteMuted}
          />
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.statRow3}>
          <StatCard label="Assigned Work" count={0} iconKey="assigned" />
          <StatCard label="Unassign Work" count={0} iconKey="unassign" />
          <StatCard label="My Work" count={0} iconKey="mywork" />
        </View>

        <View style={styles.divider} />

        <View style={styles.emptyState}>
          <Image source={require('../assets/icons/empty_icon.png')} style={styles.emptyIcon} />
          <View style={styles.emptyTextGroup}>
            <Text style={styles.emptyTitle}>No work to show yet</Text>
            <Text style={styles.emptyBody}>
              Work appears when assigned by your supervisor, requested by a user, or created by you as needed.
            </Text>
          </View>
        </View>
      </View>

      {syncStatus && (
        <View style={styles.syncToast}>
          <Text style={styles.syncToastText}>{syncStatus}</Text>
        </View>
      )}

      <View style={styles.fabArea}>
        <TouchableOpacity
          onPress={handleSyncNow}
          disabled={isSyncing}
          style={[styles.fab, isSyncing && styles.fabDisabled, theme.shadow.fab]}
          activeOpacity={0.8}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Image
              source={require('../assets/icons/map.png')}
              style={[styles.icon20, {tintColor: theme.colors.primary}]}
            />
          )}
          <Text style={styles.fabText}>{isSyncing ? 'Syncing…' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.primary},
  header: {backgroundColor: theme.colors.primary, paddingBottom: theme.spacing.lg},
  headerInner: {
    paddingHorizontal: theme.spacing.lg,
    gap: 32,
  },
  headerTextCol: {gap: 4},
  gap4: {gap: 4},
  programName: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    lineHeight: 24,
  },
  shiftRow: {gap: 4, paddingLeft: 24},
  shiftLabel: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.textLight,
    fontSize: theme.fontSize.xs,
  },
  icon20: {width: 20, height: 20},
  icon14: {width: 14, height: 14},
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.whiteGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.whiteGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    color: theme.colors.white,
    lineHeight: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: theme.spacing.lg,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: theme.colors.whiteSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.whiteSubtle,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    padding: 0,
    lineHeight: 24,
  },
  body: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  statRow3: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    gap: 8,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLabel,
  },
  statRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  statCount: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textDark,
  },
  statIcon: {width: 20, height: 20},
  divider: {height: 1, backgroundColor: theme.colors.divider, marginHorizontal: theme.spacing.lg, marginTop: 10},
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 40,
    gap: 24,
  },
  emptyIcon: {width: 60, height: 60},
  emptyTextGroup: {alignItems: 'center', gap: 10},
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBody: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs + 2,
    textAlign: 'center',
    lineHeight: 18,
  },
  syncToast: {
    position: 'absolute',
    bottom: 160,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.toastBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  syncToastText: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.white,
    fontSize: theme.fontSize.xs + 2,
  },
  fabArea: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 100,
    gap: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.primaryAlpha,
    borderRadius: theme.radius.xl,
  },
  fabDisabled: {opacity: 0.6},
  fabText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
    lineHeight: 20,
  },
});

export default HomeScreen;
