import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {theme} from '../../theme';

interface Props {
  children: React.ReactNode;
  /** Frosted variant used by the auth forms; solid white otherwise. */
  frosted?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Card: React.FC<Props> = ({children, frosted = false, style}) => (
  <View style={[frosted ? styles.frosted : styles.solid, style]}>
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
});

export default Card;
