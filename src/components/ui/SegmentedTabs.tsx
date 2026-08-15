import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../../theme';

export interface SegmentedTabItem {
  key: string;
  label: string;
  /** Optional pill after the label — omit for a tab that doesn't count rows. */
  count?: number;
}

interface Props {
  tabs: SegmentedTabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/**
 * The design's `.wm-seg`: one track holding equal-width tabs, the active one
 * lifted out in white with the primary label. Distinct from `SegmentedButtons`,
 * which is a row of separate outlined pills that fill solid primary — that one
 * is the design's `.stb`, used for the detail screens' panel switchers.
 *
 * Getting the two the wrong way round is the reason this exists as a named
 * primitive rather than being restyled per screen: Work and Equipment both
 * ship this control, so it should be one component, not two lookalikes.
 */
const SegmentedTabs: React.FC<Props> = ({tabs, activeKey, onSelect}) => (
  <View style={styles.row}>
    {tabs.map(tab => {
      const active = tab.key === activeKey;
      return (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, active && styles.tabActive]}
          activeOpacity={0.85}
          onPress={() => onSelect(tab.key)}>
          <Text style={[styles.label, active && styles.labelActive]}>
            {tab.label}
          </Text>
          {tab.count === undefined ? null : (
            <View style={[styles.count, active && styles.countActive]}>
              <Text style={[styles.countText, active && styles.countTextActive]}>
                {tab.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  // Track is the chip fill rather than a solid gray, so the page gradient
  // reads through it the way the filter chips beneath it do.
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.glass.chipFill,
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    borderRadius: 14,
    padding: 4,
    ...theme.shadow.glassPill,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: theme.glass.buttonFill,
    ...theme.shadow.glassPill,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  labelActive: {color: theme.colors.primary, fontFamily: theme.fonts.black},
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countActive: {backgroundColor: theme.colors.accentTint},
  countText: {
    fontFamily: theme.fonts.black,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  countTextActive: {color: theme.colors.primary},
});

export default SegmentedTabs;
