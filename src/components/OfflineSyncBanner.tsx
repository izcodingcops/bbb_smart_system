import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useAppSelector} from '../redux/store';
import {theme} from '../theme';

interface Props {
  endpoint: string;
}

const OfflineSyncBanner: React.FC<Props> = ({endpoint}) => {
  const pendingCount = useAppSelector(
    state => state.offlineQueue.pending.filter(record => record.endpoint === endpoint).length,
  );

  if (pendingCount === 0) {
    return null;
  }

  return (
    <View style={styles.banner} testID="offline-sync-banner">
      <Text style={styles.text}>
        {pendingCount} {pendingCount === 1 ? 'record' : 'records'} waiting to sync
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.toastBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.white,
    fontSize: theme.fontSize.xs + 2,
  },
});

export default OfflineSyncBanner;
