import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {StarIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  value: number;
  max: number;
}

/**
 * The live score beside the form's title, updating as the checklist is
 * answered.
 *
 * Local to this module for now. RVP Site Visit scores the same way over 74
 * questions and will want exactly this — promote it to `components/ui/` when
 * that second consumer arrives, not before.
 */
const RatingBadge: React.FC<Props> = ({value, max}) => (
  <View style={styles.root}>
    <StarIcon size={19} color="#F5A623" />
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.max}>/{max}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {flexDirection: 'row', alignItems: 'center', gap: 5},
  value: {
    fontFamily: theme.fonts.black,
    fontSize: 17,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
  max: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
});

export default RatingBadge;
