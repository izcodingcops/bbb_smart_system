import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {theme} from '../../theme';

/**
 * The two-column field grid. Exported for bodies that need the same grid
 * without a section heading — e.g. the Dispatch accordions.
 */
export const detailGrid: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  rowGap: 18,
  columnGap: 14,
};

interface Props {
  title: string;
  /**
   * False when the body is not a field grid — e.g. Maintenance's Comment
   * section, which holds a list component rather than DetailField cells.
   */
  grid?: boolean;
  /**
   * Trailing control on the heading row — e.g. POI's "Add" button on its
   * Interaction History and Update History sections.
   */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Heading over a hairline-separated block of `DetailField` cells. */
const DetailSection: React.FC<Props> = ({
  title,
  grid = true,
  action,
  children,
}) => (
  <View style={styles.section}>
    <View style={styles.titleRow}>
      <Text style={[styles.title, !action && styles.titleAlone]}>{title}</Text>
      {action}
    </View>
    {grid ? <View style={detailGrid}>{children}</View> : children}
  </View>
);

const styles = StyleSheet.create({
  // Full-bleed translucent band rather than an inset card: the sections butt
  // against each other, separated only by a hairline, and the page gradient
  // tints each one differently down the screen.
  section: {
    backgroundColor: theme.glass.sheetFill,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dividerOnGlass,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  title: {
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 17.5,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
  // Without an action the row is a single child, so the title takes the width
  // it always had rather than being squeezed by space-between.
  titleAlone: {flex: 1},
});

export default DetailSection;
