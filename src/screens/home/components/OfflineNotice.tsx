import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../../../theme';

interface Props {
  pendingCount: number;
}

const OfflineNotice: React.FC<Props> = ({pendingCount}) => (
  <View style={styles.card}>
    <View style={styles.icon} />
    <View style={styles.flex}>
      <Text style={styles.title}>It seems you're offline</Text>
      <Text style={styles.body}>
        Work will sync automatically once you're online.
      </Text>
    </View>
    <View style={styles.pill}>
      <Text style={styles.pillText}>{pendingCount} Pending</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: {flex: 1},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadow.card,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: '#E6E9ED',
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: '#181B1F',
    marginBottom: 2,
  },
  body: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  pill: {
    backgroundColor: '#F1F3F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default OfflineNotice;
