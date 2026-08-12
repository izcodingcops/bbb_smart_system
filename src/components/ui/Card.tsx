import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {theme} from '../../theme';

interface Props {
  children: React.ReactNode;
  /** Frosted variant used by the auth forms; solid white otherwise. */
  frosted?: boolean;
  /**
   * Glass variant from the current design language — a translucent vertical
   * gradient over `ScreenBackground`, with a light border and two layered
   * shadows. Takes precedence over `frosted`.
   */
  glass?: boolean;
  /** Tighter padding — Home's Recent Work and the Work tab opt in. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Card: React.FC<Props> = ({
  children,
  frosted = false,
  glass = false,
  compact = false,
  style,
}) => (
  <View
    style={[
      glass ? styles.glass : frosted ? styles.frosted : styles.solid,
      compact && styles.compact,
      style,
    ]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  solid: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  frosted: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadow.card,
  },
  glass: {
    backgroundColor: theme.glass.cardFillFlat,
    experimental_backgroundImage: theme.glass.cardFillGradient,
    borderRadius: theme.radius.glass,
    borderWidth: 1,
    borderColor: theme.glass.cardBorder,
    padding: theme.spacing.lg,
    ...theme.shadow.glass,
  },
  // The source design has no smaller card variant — Home's Recent Work reuses
  // the same 16px-padded card as the full list — so `compact` no longer
  // shrinks padding. Kept as a prop (harmless no-op) rather than ripping it
  // out of every call site.
  compact: {padding: theme.spacing.lg},
});

export default Card;
