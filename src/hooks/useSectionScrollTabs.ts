import {useRef, useState} from 'react';
import {NativeScrollEvent, NativeSyntheticEvent, ScrollView} from 'react-native';

/** Scroll offset (px) past which the section tabs fade in and start tracking. */
const TABS_SHOW_AT = 40;

/**
 * Slack (px) for the "scrolled to bottom" check. contentSize rounding can
 * drift by a few px across devices/DPIs, so this needs to comfortably clear
 * that drift or the last tab can fail to pin on some Android devices.
 */
const BOTTOM_EPSILON = 6;

interface Options {
  /** Section keys, in the order they appear on screen (top to bottom). */
  sectionKeys: string[];
  /** Fires before scrolling to a tapped section — e.g. to force an accordion open. */
  onSelect?: (key: string) => void;
}

/**
 * Drives a scroll-linked "section tabs" row shared by long create/edit forms:
 * tracks which section is active as the user scrolls, and jumps to a section
 * when its tab is tapped.
 *
 * Two things need extra care here:
 * - While a tab-triggered scrollTo animation is in flight, onScroll fires
 *   throughout it and would otherwise re-derive the active tab from whatever
 *   section is passing by mid-flight, flashing the wrong tab before settling.
 * - The active tab is normally picked via a scan line partway down the
 *   viewport, but the last section is often shorter than that — so scrolling
 *   to the very bottom would leave the previous tab lit forever. Pin the
 *   last tab whenever the scroll has hit the bottom of the content instead.
 */
export function useSectionScrollTabs({sectionKeys, onSelect}: Options) {
  const scrollRef = useRef<ScrollView>(null);
  /** Each section's y-offset within the scroll content, captured via onLayout. */
  const sectionOffsets = useRef<Record<string, number>>({});
  const isTabScrolling = useRef(false);

  const [activeTab, setActiveTab] = useState(sectionKeys[0]);
  const [tabsVisible, setTabsVisible] = useState(false);

  const recordSectionY = (key: string) => (event: {
    nativeEvent: {layout: {y: number}};
  }) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {y} = e.nativeEvent.contentOffset;
    const viewportHeight = e.nativeEvent.layoutMeasurement.height;
    const contentHeight = e.nativeEvent.contentSize.height;
    setTabsVisible(y > TABS_SHOW_AT);

    if (isTabScrolling.current) {
      return;
    }

    const atBottom = y + viewportHeight >= contentHeight - BOTTOM_EPSILON;
    if (atBottom) {
      setActiveTab(sectionKeys[sectionKeys.length - 1]);
      return;
    }

    const line = y + viewportHeight * 0.4;
    let active = sectionKeys[0];
    for (const key of sectionKeys) {
      const sectionY = sectionOffsets.current[key];
      if (sectionY !== undefined && sectionY <= line) {
        active = key;
      }
    }
    setActiveTab(active);
  };

  /** Hands tracking back to the live scroll position once it settles or the user grabs it. */
  const releaseTabScroll = () => {
    isTabScrolling.current = false;
  };

  const handleTabSelect = (key: string) => {
    onSelect?.(key);
    isTabScrolling.current = true;
    const targetY = sectionOffsets.current[key] ?? 0;
    scrollRef.current?.scrollTo({y: Math.max(0, targetY - 12), animated: true});
    setActiveTab(key);
  };

  return {
    scrollRef,
    activeTab,
    tabsVisible,
    recordSectionY,
    handleScroll,
    handleScrollBeginDrag: releaseTabScroll,
    handleMomentumScrollEnd: releaseTabScroll,
    handleTabSelect,
  };
}
