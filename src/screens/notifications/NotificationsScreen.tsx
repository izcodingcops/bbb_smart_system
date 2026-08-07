import React, {useCallback, useMemo, useState} from 'react';
import {
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {EmptyState, RecordCardSkeleton} from '../../components/ui';
import {CheckIcon, ChevronLeftIcon} from '../../components/icons';
import ScreenBackground from '../../components/ScreenBackground';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../graphql/features/notification/hooks';
import {AppNotification} from '../../types/notification';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../home/routes';
import NotificationCard from './components/NotificationCard';
import {groupNotifications} from './grouping';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
}

/** The export's two chips — a view switch, not a filter field. */
type ChipView = 'all' | 'unread';

const NotificationsScreen: React.FC<Props> = ({onClose}) => {
  const {data: notifications = [], isLoading, isError, refetch} =
    useGetNotificationsQuery();
  const [view, setView] = useState<ChipView>('all');
  const navigation =
    useNavigation<
      NativeStackNavigationProp<HomeStackParamList, 'HomeNotifications'>
    >();
  const {mutate: markRead} = useMarkNotificationReadMutation();
  const {mutate: markAllRead} = useMarkAllNotificationsReadMutation();

  const unreadCount = useMemo(
    () => notifications.filter(n => n.unread).length,
    [notifications],
  );

  const sections = useMemo(
    () =>
      groupNotifications(
        view === 'unread' ? notifications.filter(n => n.unread) : notifications,
      ),
    [notifications, view],
  );

  /**
   * The export opened a fabricated record card here. This opens the real one:
   * mark read, then push its detail on top of this screen. A notification with
   * nothing to open — System, and Equipment until that module exists — stops
   * at the mark.
   *
   * The detail is pushed into this stack rather than onto the owning module's
   * tab, so back returns to this list where the user came from instead of
   * stranding them on a module list they never asked for.
   */
  const handlePress = useCallback(
    (notification: AppNotification) => {
      if (notification.unread) {
        markRead(notification.id).catch(() => {});
      }
      const related = notification.related;
      if (!related) return;
      navigation.navigate('HomeRecordView', {
        kind: related.recordType,
        id: related.recordId,
      });
    },
    [markRead, navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: AppNotification}) => (
      <NotificationCard notification={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  // Rendered on every branch — loading and error included. This screen hides
  // the tab bar, so withholding its back button on a failed load would leave
  // only the hardware/gesture back to escape with.
  const header = (
    <View style={styles.head}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={onClose}>
          <ChevronLeftIcon size={20} color="#33383F" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAll}
            activeOpacity={0.85}
            onPress={() => markAllRead().catch(() => {})}>
            <CheckIcon size={16} color={theme.colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.chips}>
        {([
          ['all', 'All', notifications.length],
          ['unread', 'Unread', unreadCount],
        ] as const).map(([key, label, count]) => {
          const on = view === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, on && styles.chipOn]}
              activeOpacity={0.85}
              onPress={() => setView(key)}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {label}
              </Text>
              <View style={[styles.chipCount, on && styles.chipCountOn]}>
                <Text
                  style={[styles.chipCountText, on && styles.chipCountTextOn]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const empty = isError ? (
    <EmptyState
      icon={<CheckIcon size={28} color={theme.colors.primary} />}
      title="Couldn't load notifications"
      body="Something went wrong fetching your notifications. Check your connection and try again."
      actionLabel="Retry"
      onAction={refetch}
    />
  ) : (
    <EmptyState
      icon={<CheckIcon size={28} color={theme.colors.success} />}
      title="You’re all caught up"
      body={
        view === 'unread'
          ? 'No unread notifications. New activity from your work will show up here.'
          : 'No notifications yet. New activity from your work will show up here.'
      }
    />
  );

  return (
    <ScreenBackground style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {header}

        {isLoading ? (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {Array.from({length: 5}).map((_, index) => (
              <RecordCardSkeleton key={index} fieldCount={2} />
            ))}
          </ScrollView>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            renderItem={renderItem}
            renderSectionHeader={({section}) => (
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>
                  {section.title.toUpperCase()}
                </Text>
                <Text style={styles.groupCount}>{section.data.length}</Text>
                <View style={styles.groupLine} />
              </View>
            )}
            ListEmptyComponent={empty}
          />
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  head: {paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm},
  topRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  title: {
    flex: 1,
    fontFamily: theme.fonts.black,
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#181B1F',
  },
  markAll: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  markAllText: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: theme.colors.primary,
  },
  chips: {flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg},
  chip: {
    height: 36,
    paddingHorizontal: 15,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  chipOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textSecondary,
  },
  chipTextOn: {color: theme.colors.white},
  chipCount: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  chipCountOn: {backgroundColor: 'rgba(255,255,255,0.25)'},
  chipCountText: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  chipCountTextOn: {color: theme.colors.white},
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 2,
    paddingBottom: theme.spacing.xxl,
    gap: 10,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: theme.spacing.sm,
    marginBottom: 2,
  },
  groupTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    letterSpacing: 0.5,
    color: theme.colors.textSecondary,
  },
  groupCount: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  groupLine: {flex: 1, height: 1, backgroundColor: theme.colors.border},
});

export default NotificationsScreen;
