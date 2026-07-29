import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SortIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  /** Count comes from the current tab's full bucket, so it holds steady while filtering. */
  total: number;
  visible: number;
  /** True once a search term or any filter is active. */
  isNarrowed: boolean;
  sortLabel: string;
  /** 'assignments' for the Assigned tab, 'records' for Completed. */
  noun: string;
}

const ListSummary: React.FC<Props> = ({
  total,
  visible,
  isNarrowed,
  sortLabel,
  noun,
}) => (
  <View style={styles.row}>
    <Text style={styles.counts}>
      {isNarrowed ? (
        <>
          <Text style={styles.countsBold}>{visible}</Text> of{' '}
          <Text style={styles.countsBold}>{total}</Text> {noun}
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
