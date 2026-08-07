import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {AppNotification} from '../../../types/notification';
import {MODULE_META, notificationIcon} from '../moduleMeta';
import {relativeTime} from '../grouping';
import {theme} from '../../../theme';

interface Props {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

/**
 * The message arrives with its emphasis marked as `**bold**` rather than as
 * HTML — React Native has no HTML renderer, and a segment array would put
 * presentation in the SDL. Splitting on the marker leaves odd indices bold.
 */
function renderMessage(message: string): React.ReactNode {
  return message.split('**').map((part, index) =>
    index % 2 === 1 ? (
      <Text key={index} style={styles.messageStrong}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
}

const NotificationCard: React.FC<Props> = ({notification, onPress}) => {
  const meta = MODULE_META[notification.module];
  const Icon = notificationIcon(notification.module, notification.icon);

  return (
    <TouchableOpacity
      style={[styles.row, notification.unread && styles.rowUnread]}
      activeOpacity={0.85}
      onPress={() => onPress(notification)}>
      <View style={[styles.iconTile, {backgroundColor: meta.tint}]}>
        <Icon size={22} color={meta.accent} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{renderMessage(notification.message)}</Text>

        <View style={styles.tagRow}>
          <View style={[styles.badge, {backgroundColor: meta.tint}]}>
            <View style={[styles.badgeDot, {backgroundColor: meta.accent}]} />
            <Text style={[styles.badgeText, {color: meta.accent}]}>
              {meta.label.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.time}>{relativeTime(notification.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.end}>
        {notification.unread ? <View style={styles.unreadDot} /> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: 13,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  rowUnread: {backgroundColor: '#F2F9FF', borderColor: '#D8ECFB'},
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {flex: 1, minWidth: 0},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    letterSpacing: -0.1,
    color: '#20242A',
  },
  message: {
    marginTop: 3,
    fontFamily: theme.fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  messageStrong: {fontFamily: theme.fonts.black, color: '#2B2F35'},
  tagRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  badgeDot: {width: 6, height: 6, borderRadius: 2},
  badgeText: {
    fontFamily: theme.fonts.black,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  time: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  end: {paddingTop: 4},
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
});

export default React.memo(NotificationCard);
