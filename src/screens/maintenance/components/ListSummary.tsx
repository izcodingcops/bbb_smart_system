import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SortIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  /** Counts come from the full record set, so they hold steady while filtering. */
  total: number;
  open: number;
  inProgress: number;
  visible: number;
  /** True once a search term or any filter is active. */
  isNarrowed: boolean;
  sortLabel: string;
}

const ListSummary: React.FC<Props> = ({
  total,
  open,
  inProgress,
  visible,
  isNarrowed,
  sortLabel,
}) => (
  <View style={styles.row}>
    {/* Only the numbers go dark/heavy — the surrounding words stay light. */}
    <Text style={styles.counts}>
      {isNarrowed ? (
        <>
          <Text style={styles.countsBold}>{visible}</Text> of{' '}
          <Text style={styles.countsBold}>{total}</Text> requests
        </>
      ) : (
        <>
          <Text style={styles.countsBold}>{total}</Text> Total ·{' '}
          <Text style={styles.countsBold}>{open}</Text> Open ·{' '}
          <Text style={styles.countsBold}>{inProgress}</Text> In Progress
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
    // Pairs with FilterChips' 8pt bottom padding to make a 20pt gap above,
    // matching the 20pt gap this leaves below against the first card.
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
