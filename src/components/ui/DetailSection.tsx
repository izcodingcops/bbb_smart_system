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
  children: React.ReactNode;
}

/** Heading over a hairline-separated block of `DetailField` cells. */
const DetailSection: React.FC<Props> = ({title, grid = true, children}) => (
  <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>
    {grid ? <View style={detailGrid}>{children}</View> : children}
  </View>
);

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 17.5,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
});

export default DetailSection;
