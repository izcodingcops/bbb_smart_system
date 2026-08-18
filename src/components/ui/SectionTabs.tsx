import React from 'react';
import {View, StyleSheet} from 'react-native';
import ScrollableTabs, {ScrollableTabItem} from './ScrollableTabs';
import {theme} from '../../theme';

/** The strip's own item type — this variant adds nothing to it. */
export type SectionTabItem = ScrollableTabItem;

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
 *
 * The strip itself is `ScrollableTabs`; what this adds is the floating shell
 * and the `visible` gate.
 */
const SectionTabs: React.FC<Props> = ({tabs, activeKey, visible, onSelect}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <ScrollableTabs tabs={tabs} activeKey={activeKey} onSelect={onSelect} />
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
});

export default SectionTabs;
