import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SortIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  /** Counts come from the full record set, so they hold steady while filtering. */
  total: number;
  visible: number;
  /** True once a search term or any filter is active. */
  isNarrowed: boolean;
  sortLabel: string;
  /** 'requests' / 'fixtures' / 'assignments'. */
  noun: string;
  /** Extra counts shown after 'Total' when not narrowed, e.g. Maintenance's Open/In Progress. */
  breakdown?: {label: string; value: number}[];
}

const ListSummary: React.FC<Props> = ({
  total,
  visible,
  isNarrowed,
  sortLabel,
  noun,
  breakdown,
}) => (
  <View style={styles.row}>
    <Text style={styles.counts}>
      {isNarrowed ? (
        <>
          <Text style={styles.countsBold}>{visible}</Text> of{' '}
          <Text style={styles.countsBold}>{total}</Text> {noun}
        </>
      ) : breakdown ? (
        <>
          <Text style={styles.countsBold}>{total}</Text> Total
          {breakdown.map(item => (
            <React.Fragment key={item.label}>
              {' · '}
              <Text style={styles.countsBold}>{item.value}</Text> {item.label}
            </React.Fragment>
          ))}
        </>
      ) : (
        <>
          <Text style={styles.countsBold}>{total}</Text> {noun}
        </>
      )}
    </Text>
    <View style={styles.sortRow}>
      <SortIcon size={13} color={theme.colors.textSecondary} />
      <Text style={styles.sort}>{sortLabel}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  counts: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  countsBold: {fontFamily: theme.fonts.black, color: '#181B1F'},
  sortRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  sort: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
});

export default ListSummary;
