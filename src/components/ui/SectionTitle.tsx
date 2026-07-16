import React from 'react';
import {View, Text, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {theme} from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  /** Rendered on the right of the title row (e.g. a "View All" link). */
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const SectionTitle: React.FC<Props> = ({title, subtitle, action, style}) => (
  <View style={style}>
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 19,
    lineHeight: 19,
    letterSpacing: -0.3,
    color: '#181B1F',
  },
  subtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 18.9,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

export default SectionTitle;
