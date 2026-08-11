import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {PlusIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  onPress: () => void;
}

const SIZE = 60;
/** The halo sits 5pt outside the button on every side. */
const RING_INSET = 5;

/** Kept identical to HomeScreen's FAB — same size, radius, offset and shadow. */
const GradientFab: React.FC<Props> = ({onPress}) => (
  <TouchableOpacity
    style={styles.touchable}
    activeOpacity={0.85}
    onPress={onPress}>
    {/* Decorative halo ring, drawn outside the button's own bounds. */}
    <View style={styles.ring} pointerEvents="none" />
    <LinearGradient
      colors={theme.gradients.fab}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.fab}>
      <PlusIcon size={28} color={theme.colors.white} />
    </LinearGradient>
  </TouchableOpacity>
);

const GRADIENT_START = {x: 0, y: 0};
const GRADIENT_END = {x: 0.8, y: 1};

const styles = StyleSheet.create({
  touchable: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xxl,
    width: SIZE,
    height: SIZE,
    borderRadius: theme.radius.glass,
    ...theme.shadow.fabGlass,
  },
  ring: {
    position: 'absolute',
    top: -RING_INSET,
    left: -RING_INSET,
    width: SIZE + RING_INSET * 2,
    height: SIZE + RING_INSET * 2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0,102,178,0.18)',
  },
  fab: {
    width: SIZE,
    height: SIZE,
    borderRadius: theme.radius.glass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GradientFab;
