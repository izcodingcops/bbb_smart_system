import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {BellIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  programName: string;
  shiftName: string;
  firstName: string;
  avatarUri?: string;
  notificationCount: number;
  isOnline: boolean;
  onAvatarPress: () => void;
}

const HomeHeader: React.FC<Props> = ({
  programName,
  shiftName,
  firstName,
  avatarUri,
  notificationCount,
  isOnline,
  onAvatarPress,
}) => (
  <>
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.program} numberOfLines={1}>
          {programName}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.dot, !isOnline && styles.dotOffline]} />
          <Text style={styles.meta}>{shiftName} · Day Shift</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
        <BellIcon size={22} color="#181B1F" />
        {notificationCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.avatarBtn}
        activeOpacity={0.8}
        onPress={onAvatarPress}>
        {avatarUri ? (
          <Image source={{uri: avatarUri}} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarInitial}>
            {firstName.charAt(0).toUpperCase()}
          </Text>
        )}
      </TouchableOpacity>
    </View>

    <View style={styles.greetRow}>
      <Text style={styles.greeting}>Welcome back, {firstName} 👋</Text>
      <View style={styles.pill}>
        <View style={[styles.dot, !isOnline && styles.dotOffline]} />
        <Text style={[styles.pillText, !isOnline && styles.pillTextOffline]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
    </View>
  </>
);

const styles = StyleSheet.create({
  flex: {flex: 1},
  row: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm},
  program: {fontFamily: theme.fonts.black, fontSize: 16, color: '#181B1F'},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A'},
  dotOffline: {backgroundColor: theme.colors.textMuted},
  meta: {
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
  badge: {
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
  badgeText: {
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...theme.shadow.card,
  },
  pillText: {fontFamily: theme.fonts.black, fontSize: 12, color: '#16A34A'},
  pillTextOffline: {color: theme.colors.textSecondary},
});

export default HomeHeader;
