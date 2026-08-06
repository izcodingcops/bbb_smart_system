import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {theme} from '../../../theme';

export interface PoiDetailTab {
  key: string;
  label: string;
}

interface Props {
  tabs: PoiDetailTab[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/**
 * The detail screen's three-way panel switcher. Deliberately not `SectionTabs`:
 * that one is absolute-positioned and visibility-gated for sticky *form* tabs,
 * and bending it to sit inline in a scroll flow would compromise its four
 * existing callers. Styled to match its pills.
 */
const PoiDetailTabs: React.FC<Props> = ({tabs, activeKey, onSelect}) => (
  <View style={styles.wrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {tabs.map(tab => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            activeOpacity={0.8}
            onPress={() => onSelect(tab.key)}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
    backgroundColor: theme.colors.white,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 11,
    gap: 8,
  },
  tab: {
    height: 36,
    paddingHorizontal: 15,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  label: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  labelActive: {color: theme.colors.white},
});

export default PoiDetailTabs;
