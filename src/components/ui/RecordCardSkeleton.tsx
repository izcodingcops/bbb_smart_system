import React from 'react';
import {View, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import Card from './Card';
import Skeleton from './Skeleton';
import {theme} from '../../theme';

interface Props {
  /** Matches the number of `fields` the real card renders — 2 for Maintenance, 3 for Fixture/Work. */
  fieldCount?: 2 | 3;
  /** Forwarded to the Card — e.g. a trailing marginBottom to match a caller's real-card spacing. */
  style?: StyleProp<ViewStyle>;
}

/** Loading placeholder shaped like RecordCard — id/type header, status pill, date, field grid, address. */
const RecordCardSkeleton: React.FC<Props> = ({fieldCount = 2, style}) => (
  <Card style={[styles.card, style]}>
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <Skeleton width={70} height={15} />
        <Skeleton width={90} height={13} />
      </View>
      <Skeleton width={72} height={24} radius={999} />
    </View>

    <Skeleton width={130} height={12} />

    <View style={styles.divider} />

    <View style={styles.grid}>
      {Array.from({length: fieldCount}).map((_, index) => (
        <View key={index} style={styles.gridCell}>
          <Skeleton width={50} height={11} />
          <Skeleton width="80%" height={13} />
        </View>
      ))}
    </View>

    <View style={styles.addressBlock}>
      <Skeleton width={60} height={11} />
      <Skeleton width="90%" height={13} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {gap: theme.spacing.sm},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1},
  divider: {height: 1, backgroundColor: '#EEF0F2'},
  grid: {flexDirection: 'row', gap: theme.spacing.sm},
  gridCell: {flex: 1, gap: 4},
  addressBlock: {gap: 4, marginTop: theme.spacing.xs},
});

export default RecordCardSkeleton;
