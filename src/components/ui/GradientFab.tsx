import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {PlusIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  onPress: () => void;
}

/** Kept identical to HomeScreen's FAB — same size, radius, offset and shadow. */
const GradientFab: React.FC<Props> = ({onPress}) => (
  <TouchableOpacity style={styles.touchable} activeOpacity={0.85} onPress={onPress}>
    <LinearGradient
      // Design's --primary-hover → --primary, 145deg.
      colors={['#0092FF', theme.colors.primary]}
      start={{x: 0.15, y: 0}}
      end={{x: 0.85, y: 1}}
      style={styles.fab}>
      <PlusIcon size={26} color={theme.colors.white} />
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  touchable: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 18,
    ...theme.shadow.fab,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GradientFab;
