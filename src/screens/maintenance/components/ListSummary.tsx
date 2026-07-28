import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
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
    <Text style={styles.counts}>
      {isNarrowed
        ? `${visible} of ${total} requests`
        : `${total} Total · ${open} Open · ${inProgress} In Progress`}
    </Text>
    <Text style={styles.sort}>{sortLabel}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    // Pairs with FilterChips' 4pt bottom padding to make a 12pt gap above,
    // matching the 12pt gap this leaves below against the first card.
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  counts: {fontFamily: theme.fonts.black, fontSize: 12, color: '#181B1F'},
  sort: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default ListSummary;
