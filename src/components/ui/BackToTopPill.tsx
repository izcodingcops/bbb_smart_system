import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ArrowUpIcon} from '../icons';
import {theme} from '../../theme';

interface Props {
  visible: boolean;
  onPress: () => void;
}

const BackToTopPill: React.FC<Props> = ({visible, onPress}) =>
  visible ? (
    <TouchableOpacity style={styles.pill} activeOpacity={0.85} onPress={onPress}>
      <ArrowUpIcon size={14} />
      <Text style={styles.text}>Back to top</Text>
    </TouchableOpacity>
  ) : null;

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: theme.spacing.xxl + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
    ...theme.shadow.backToTop,
  },
  text: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
});

export default BackToTopPill;
