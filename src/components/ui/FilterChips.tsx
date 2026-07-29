import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {ChevronDownIcon} from '../icons';
import {theme} from '../../theme';

const CHIP_HEIGHT = 36;

interface Props<F extends string> {
  fields: F[];
  fieldLabel: Record<F, string>;
  filters: Record<F, string[]>;
  formatValue: (field: F, value: string) => string;
  onOpen: (field: F) => void;
  onClear: (field: F) => void;
}

/**
 * One selected value reads in full ('Priority · High'); more than one collapses
 * to a count, since the chip row can't grow sideways forever.
 */
function chipLabel<F extends string>(
  field: F,
  fieldLabel: Record<F, string>,
  formatValue: (field: F, value: string) => string,
  selected: string[],
): string {
  if (selected.length === 0) {
    return fieldLabel[field];
  }
  if (selected.length > 1) {
    return `${fieldLabel[field]} · ${selected.length}`;
  }
  return `${fieldLabel[field]} · ${formatValue(field, selected[0])}`;
}

function FilterChips<F extends string>({
  fields,
  fieldLabel,
  filters,
  formatValue,
  onOpen,
  onClear,
}: Props<F>) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}>
        {fields.map(field => {
          const selected = filters[field];
          const active = selected.length > 0;
          return (
            <TouchableOpacity
              key={field}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => onOpen(field)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chipLabel(field, fieldLabel, formatValue, selected)}
              </Text>
              {active ? (
                <TouchableOpacity
                  style={styles.clear}
                  activeOpacity={0.8}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  onPress={() => onClear(field)}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <ChevronDownIcon size={14} color="#8B9099" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: theme.spacing.xl,
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
    paddingHorizontal: theme.spacing.md,
  },
  chipActive: {
    borderColor: '#99D3FF',
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
