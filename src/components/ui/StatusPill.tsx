import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ChevronDownIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  label: string;
  bg: string;
  fg: string;
  /** Omitted → a plain, non-interactive pill. */
  onPress?: () => void;
  /** Shows a small chevron after the label — paired with an interactive pill. */
  trailingChevron?: boolean;
  /**
   * 'sm' (default) is the list-card pill (11px text, tight padding).
   * 'md' is the view-screen detail pill (12.5px text, wider padding, self-starts
   * inside a grid cell rather than filling a row).
   */
  size?: 'sm' | 'md';
}

const StatusPill: React.FC<Props> = ({
  label,
  bg,
  fg,
  onPress,
  trailingChevron,
  size = 'sm',
}) => (
  <TouchableOpacity
    style={[
      styles.pill,
      size === 'md' && styles.pillMd,
      {backgroundColor: bg},
    ]}
    activeOpacity={onPress ? 0.8 : 1}
    disabled={!onPress}
    onPress={onPress}>
    <Text style={[styles.pillText, size === 'md' && styles.pillTextMd, {color: fg}]}>
      {label}
    </Text>
    {trailingChevron ? <ChevronDownIcon size={12} color={fg} /> : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {fontFamily: theme.fonts.black, fontSize: 11},
  pillMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillTextMd: {fontSize: 12.5},
});

// Renders once per visible FlatList row (list cards) or grid cell (detail
// screens) — memoized so a sibling card's re-render (e.g. its own kebab
// toggling) doesn't re-render every other pill on screen.
export default React.memo(StatusPill);
