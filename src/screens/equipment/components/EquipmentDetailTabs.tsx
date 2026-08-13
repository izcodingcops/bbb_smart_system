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
 * The detail screen's Equipment / Upkeep panel switcher. Two tabs only, so it
 * fills the row rather than scrolling horizontally the way POI's three-way
 * switcher does.
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default EquipmentDetailTabs;
