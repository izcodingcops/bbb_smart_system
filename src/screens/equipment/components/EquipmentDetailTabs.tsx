import React from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {theme} from '../../../theme';

export interface EquipmentDetailTab {
  key: string;
  label: string;
}

interface Props {
  tabs: EquipmentDetailTab[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/**
 * The detail screen's Equipment / Upkeep panel switcher — the design's
 * `.vtabs` + `.stb`: a plain row of self-contained outlined pills that fill
 * solid primary when active. Deliberately NOT the segmented track the hub
 * uses (`SegmentedTabs`); the design uses the two shapes for two different
 * jobs, and this screen had them the wrong way round.
 *
 * Pills size to their own labels rather than splitting the row, so a long
 * label like 'Equipment Details' isn't squeezed to fit an equal column.
 */
const EquipmentDetailTabs: React.FC<Props> = ({tabs, activeKey, onSelect}) => (
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
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: theme.spacing.sm},
  tab: {
    height: 36,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  labelActive: {color: theme.colors.white, fontFamily: theme.fonts.black},
});

export default EquipmentDetailTabs;
