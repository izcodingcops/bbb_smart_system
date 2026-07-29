import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {theme} from '../../theme';

interface Props {
  label: string;
  bg: string;
  fg: string;
  /** 'sm' (default) is the list-card badge; 'md' is the view-screen detail badge. */
  size?: 'sm' | 'md';
}

/** Always non-interactive — priority is never tapped to change it. */
const PriorityPill: React.FC<Props> = ({label, bg, fg, size = 'sm'}) => (
  <View style={[styles.pill, size === 'md' ? styles.pillMd : styles.pillSm, {backgroundColor: bg}]}>
    <Text style={[styles.text, size === 'md' && styles.textMd, {color: fg}]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSm: {height: 22, paddingHorizontal: 10},
  pillMd: {height: 24, paddingHorizontal: 11},
  text: {fontFamily: theme.fonts.bold, fontSize: 12},
  textMd: {fontSize: 12.5},
});

export default React.memo(PriorityPill);
