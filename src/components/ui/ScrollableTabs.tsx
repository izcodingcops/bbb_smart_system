import React, {useEffect, useRef} from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {theme} from '../../theme';

export interface ScrollableTabItem {
  key: string;
  label: string;
}

interface Props {
  tabs: ScrollableTabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * A horizontally scrolling row of pills that keeps the active one in view.
 *
 * Extracted from `SectionTabs`, which is still the floating create-form variant
 * and now renders this inside its own absolutely-positioned wrapper. RVP Site
 * Visit's detail screen shows the same strip inline — eleven section tabs that
 * switch what the body renders — so this is one control with two hosts rather
 * than a lookalike per screen.
 */
const ScrollableTabs: React.FC<Props> = ({
  tabs,
  activeKey,
  onSelect,
  style,
  contentContainerStyle,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  /** Each tab's x-offset within the strip, captured via onLayout. */
  const tabOffsets = useRef<Record<string, number>>({});

  // Keeps the active pill in view when it becomes active from something other
  // than a tap — scrolling the form itself, in SectionTabs' case.
  useEffect(() => {
    const x = tabOffsets.current[activeKey];
    if (x !== undefined) {
      scrollRef.current?.scrollTo({x: Math.max(0, x - 16), animated: true});
    }
  }, [activeKey]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={style}
      contentContainerStyle={[styles.content, contentContainerStyle]}>
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
              // First layout after the strip (re)appears: jump straight to the
              // active tab instead of waiting for activeKey to change.
              if (active) {
                scrollRef.current?.scrollTo({x: Math.max(0, x - 16), animated: false});
              }
            }}
            onPress={() => onSelect(tab.key)}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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

export default ScrollableTabs;
