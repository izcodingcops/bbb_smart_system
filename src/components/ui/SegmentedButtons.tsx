import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import CheckIcon from '../icons/CheckIcon';
import {theme} from '../../theme';

export interface SegmentOption {
  value: string;
  label: string;
}

interface Props {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  /**
   * Lets the pills wrap onto further lines and sizes them to their labels
   * instead of splitting the row evenly — the design's `.optrow` variant, as
   * against the default `.optrow.num`. Needed wherever labels are prose rather
   * than short values ("Less than 25%" / "25% - 80%" / "More than 80%"), which
   * the equal-width row crushes. Two options still fill the row, since they
   * grow from an auto basis.
   */
  wrap?: boolean;
}

/** Equal-width pills; the selected one fills primary blue and shows a tick. */
const SegmentedButtons: React.FC<Props> = ({
  options,
  value,
  onChange,
  wrap = false,
}) => (
  <View style={[styles.row, wrap && styles.rowWrap]}>
    {options.map(option => {
      const selected = option.value === value;
      return (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.button,
            wrap && styles.buttonWrap,
            selected && styles.buttonSelected,
          ]}
          activeOpacity={0.85}
          onPress={() => onChange(option.value)}>
          {selected ? <CheckIcon size={15} color={theme.colors.white} /> : null}
          <Text style={[styles.label, selected && styles.labelSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: theme.spacing.sm},
  rowWrap: {flexWrap: 'wrap'},
  button: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  // Grow to fill the line, but never shrink a label below its own width —
  // that is what lets a long option push the next one onto a new row.
  buttonWrap: {
    flex: undefined,
    flexGrow: 1,
    flexBasis: 'auto',
    paddingHorizontal: 13,
  },
  buttonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    color: theme.colors.textSecondary,
  },
  labelSelected: {
    fontFamily: theme.fonts.black,
    color: theme.colors.white,
  },
});

export default SegmentedButtons;
