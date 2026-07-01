import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../theme';

export interface ScrollSpyTab {
  key: string;
  label: string;
}

interface Props {
  tabs: ScrollSpyTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
}

const ScrollSpyTabs: React.FC<Props> = ({tabs, activeKey, onTabPress}) => (
  <View style={styles.row}>
    {tabs.map(tab => {
      const active = tab.key === activeKey;
      return (
        <TouchableOpacity
          key={tab.key}
          testID={`scroll-spy-tab-${tab.key}`}
          style={styles.tab}
          onPress={() => onTabPress(tab.key)}
          activeOpacity={0.7}>
          <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          <View style={[styles.underline, active && styles.underlineActive]} />
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  tab: {flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md},
  label: {fontFamily: theme.fonts.medium, fontSize: theme.fontSize.xs + 2, color: theme.colors.textSecondary},
  labelActive: {color: theme.colors.primary, fontFamily: theme.fonts.bold},
  underline: {height: 2, width: '100%', marginTop: theme.spacing.xs, backgroundColor: 'transparent'},
  underlineActive: {backgroundColor: theme.colors.primary},
});

export default ScrollSpyTabs;
