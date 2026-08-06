import React, {useEffect, useRef} from 'react';
import {ScrollView, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {theme} from '../../theme';

export interface SectionTabItem {
  key: string;
  label: string;
}

interface Props {
  tabs: SectionTabItem[];
  activeKey: string;
  /** Off-screen until the form has been scrolled past its first section. */
  visible: boolean;
  onSelect: (key: string) => void;
}

/**
 * Floating pill row that appears once a long create/edit form is scrolled
 * past its first section, so the user can jump straight to any other one.
 * Mirrors the sticky section tabs in the Ambassador create-flow mockups
 * (Maintenance, Fixture, Incident, Dispatch).
 */
const SectionTabs: React.FC<Props> = ({tabs, activeKey, visible, onSelect}) => {
  const scrollRef = useRef<ScrollView>(null);
  /** Each tab's x-offset within the strip, captured via onLayout. */
  const tabOffsets = useRef<Record<string, number>>({});

  // Keeps the active pill in view when it becomes active from scrolling the
  // form itself, not just from tapping a tab directly.
  useEffect(() => {
    const x = tabOffsets.current[activeKey];
    if (x !== undefined) {
      scrollRef.current?.scrollTo({x: Math.max(0, x - 16), animated: true});
    }
  }, [activeKey]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        {tabs.map(tab => {
          const active = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              activeOpacity={0.8}
              onLayout={e => {
                const x = e.nativeEvent.layout.x;
                tabOffsets.current[tab.key] = x;
                // First layout after the strip (re)appears: jump straight to
                // the active tab instead of waiting for activeKey to change.
                if (active) {
                  scrollRef.current?.scrollTo({x: Math.max(0, x - 16), animated: false});
                }
              }}
              onPress={() => onSelect(tab.key)}>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadow.card,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
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
  labelActive: {
    color: theme.colors.white,
  },
});

export default SectionTabs;
