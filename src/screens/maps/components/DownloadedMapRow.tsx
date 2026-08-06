import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {DownloadedMap} from '../../../types/maps';
import {formatDownloadedOn} from '../saving';
import {
  CloudOffIcon,
  MapPinIcon,
  TrashIcon,
} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  item: DownloadedMap;
  onPress: (item: DownloadedMap) => void;
  onDelete: (item: DownloadedMap) => void;
}

/**
 * One saved location. Memoized, so every callback the list hands it must be
 * useCallback-stable or the memo is inert.
 */
const DownloadedMapRow: React.FC<Props> = ({item, onPress, onDelete}) => (
  <TouchableOpacity
    style={styles.row}
    activeOpacity={0.85}
    onPress={() => onPress(item)}>
    <View style={styles.pinTile}>
      <MapPinIcon size={18} color={theme.colors.primary} />
    </View>

    <View style={styles.main}>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.badge}>
          <CloudOffIcon size={11} color="#C26401" />
          <Text style={styles.badgeText}>Offline</Text>
        </View>
      </View>
      <Text style={styles.address} numberOfLines={2}>
        {item.address}
      </Text>
      <Text style={styles.meta}>
        Downloaded {formatDownloadedOn(item.downloadedAt)}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.delete}
      activeOpacity={0.7}
      accessibilityLabel={`Delete ${item.name}`}
      onPress={() => onDelete(item)}>
      <TrashIcon size={18} color="#CF1322" />
    </TouchableOpacity>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  pinTile: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {flex: 1},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    color: '#181B1F',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7E6',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: theme.fonts.black,
    fontSize: 10.5,
    color: '#C26401',
  },
  address: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  meta: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  delete: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF2F0',
  },
});

export default React.memo(DownloadedMapRow);
