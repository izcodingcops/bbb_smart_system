import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {FilterField, Filters, formatFilterValue} from '../filtering';
import {theme} from '../../../theme';

export const FIELD_LABEL: Record<FilterField, string> = {
  type: 'Type',
  businessName: 'Business Name',
  priority: 'Priority',
  status: 'Status',
  dateRange: 'Date Range',
  completedBy: 'Completed By',
  assignedTo: 'Assigned To',
};

// The design's chip order.
const FIELDS: FilterField[] = [
  'type',
  'businessName',
  'priority',
  'status',
  'dateRange',
  'completedBy',
  'assignedTo',
];

const CHIP_HEIGHT = 36;

/**
 * One selected value reads in full ('Priority · High'); more than one collapses
 * to a count, since the chip row can't grow sideways forever.
 */
function chipLabel(field: FilterField, selected: string[]): string {
  if (selected.length === 0) {
    return FIELD_LABEL[field];
  }
  if (selected.length > 1) {
    return `${FIELD_LABEL[field]} · ${selected.length}`;
  }
  return `${FIELD_LABEL[field]} · ${formatFilterValue(field, selected[0])}`;
}

interface Props {
  filters: Filters;
  onOpen: (field: FilterField) => void;
  onClear: (field: FilterField) => void;
}

const FilterChips: React.FC<Props> = ({filters, onOpen, onClear}) => (
  <View style={styles.wrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}>
    {FIELDS.map(field => {
      const selected = filters[field];
      const active = selected.length > 0;
      return (
        <TouchableOpacity
          key={field}
          style={[styles.chip, active && styles.chipActive]}
          activeOpacity={0.8}
          onPress={() => onOpen(field)}>
          <Text style={[styles.chipText, active && styles.chipTextActive]}>
            {chipLabel(field, selected)}
          </Text>
          {active ? (
            <TouchableOpacity
              style={styles.clear}
              activeOpacity={0.8}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={() => onClear(field)}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  /**
   * The wrapper owns all vertical spacing so the ScrollView can be exactly one
   * chip tall. Putting padding inside the scroll's content container instead
   * means its height and that padding have to sum perfectly — they don't
   * survive RN's layout, and the pills get squashed and clipped.
   *
   * The explicit height is still required: a horizontal ScrollView has no
   * intrinsic height, and this one is a direct child of the screen's flex
   * column rather than of a vertical ScrollView (as QuickActions is), so
   * without it the row collapses entirely.
   */
  wrap: {
    paddingTop: theme.spacing.xl,
    // ListSummary adds its own 12 on top, making the 20pt rhythm the header
    // block uses throughout.
    paddingBottom: theme.spacing.sm,
  },
  scroll: {flexGrow: 0, height: CHIP_HEIGHT},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CHIP_HEIGHT,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    // 12 rather than 14: with one chip active the row lands within a few points
    // of the screen width, and the wider padding tipped it just over — eating
    // the trailing padding so the last chip jammed against the edge.
    paddingHorizontal: theme.spacing.md,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {fontFamily: theme.fonts.bold, fontSize: 13, color: '#454545'},
  chipTextActive: {fontFamily: theme.fonts.black, color: theme.colors.primary},
  clear: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontFamily: theme.fonts.bold,
    fontSize: 9,
    color: theme.colors.white,
  },
});

export default FilterChips;
