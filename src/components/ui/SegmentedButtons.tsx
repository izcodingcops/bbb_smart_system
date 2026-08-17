import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import CheckIcon from '../icons/CheckIcon';
import {theme} from '../../theme';

/**
 * How a selected pill fills. `primary` is the solid blue every existing caller
 * gets; the three semantic tones are the app's priority palette and fill with a
 * tint plus a coloured border instead, matching the design's `.pbtn.on.lo`,
 * `.mid` and `.hi`.
 */
export type SegmentTone = 'primary' | 'success' | 'warning' | 'danger';

export interface SegmentOption {
  value: string;
  label: string;
  /** Selected-state colouring. Defaults to 'primary'. */
  tone?: SegmentTone;
}

interface ToneStyle {
  bg: string;
  border: string;
  fg: string;
}

const TONE_STYLE: Record<SegmentTone, ToneStyle> = {
  primary: {
    bg: theme.colors.primary,
    border: theme.colors.primary,
    fg: theme.colors.white,
  },
  success: {bg: '#F1F9EC', border: '#72BE44', fg: '#5C9B36'},
  warning: {bg: '#FFFBE6', border: '#AD8B00', fg: '#AD8B00'},
  danger: {bg: '#FFF2F0', border: '#CF1322', fg: '#CF1322'},
};

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

/** Equal-width pills; the selected one fills with its tone and shows a tick. */
const SegmentedButtons: React.FC<Props> = ({
  options,
  value,
  onChange,
  wrap = false,
}) => (
  <View style={[styles.row, wrap && styles.rowWrap]}>
    {options.map(option => {
      const selected = option.value === value;
      const tone = TONE_STYLE[option.tone ?? 'primary'];
      return (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.button,
            wrap && styles.buttonWrap,
            selected && {backgroundColor: tone.bg, borderColor: tone.border},
          ]}
          activeOpacity={0.85}
          onPress={() => onChange(option.value)}>
          {/* The tick takes the tone's foreground, not white — on a tinted
              fill a white tick all but disappears. */}
          {selected ? <CheckIcon size={15} color={tone.fg} /> : null}
          <Text
            style={[
              styles.label,
              selected && styles.labelSelected,
              selected && {color: tone.fg},
            ]}>
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
  //
  // `flex: 0` resets the base rule's `flex: 1` to grow 0 / shrink 0 / basis
  // auto, and flexGrow puts the growth back. Setting `flex: undefined` would
  // leave it to how the style array flattens an undefined key, which is not
  // worth relying on.
  buttonWrap: {
    flex: 0,
    flexGrow: 1,
    flexBasis: 'auto',
    paddingHorizontal: 13,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    color: theme.colors.textSecondary,
  },
  // Weight only — the colour comes from the option's tone.
  labelSelected: {fontFamily: theme.fonts.black},
});

export default SegmentedButtons;
