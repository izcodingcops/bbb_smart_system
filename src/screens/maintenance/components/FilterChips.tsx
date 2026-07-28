import React from 'react';
import {Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {FilterField, Filters, QUEUED_OFFLINE_VALUE} from '../filtering';
import {theme} from '../../../theme';

export const FIELD_LABEL: Record<FilterField, string> = {
  type: 'Type',
  businessName: 'Business Name',
  priority: 'Priority',
  status: 'Status',
};

const FIELDS: FilterField[] = ['type', 'businessName', 'priority', 'status'];

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
  const value =
    selected[0] === QUEUED_OFFLINE_VALUE ? 'Queued (offline)' : selected[0];
  return `${FIELD_LABEL[field]} · ${value}`;
}

interface Props {
  filters: Filters;
  onOpen: (field: FilterField) => void;
  onClear: (field: FilterField) => void;
}

const FilterChips: React.FC<Props> = ({filters, onOpen, onClear}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
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
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
