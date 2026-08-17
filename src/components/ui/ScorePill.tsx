import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import StarIcon from '../icons/StarIcon';
import {theme} from '../../theme';

/**
 * Score tiers. The same thresholds appear in two independent handoffs — the
 * Observation Reports mockup and RVP Site Visit's `p2-schi` / `p2-scmid` /
 * `p2-sclo` — so they are the design language, not one screen's choice.
 */
const TIER = [
  {min: 3, bg: '#F6FFED', fg: '#389E0D'},
  {min: 2, bg: '#FFFBE6', fg: '#AD8B00'},
  {min: 0, bg: '#FFF2F0', fg: '#CF1322'},
];

function tierFor(score: number) {
  return TIER.find(t => score >= t.min)!;
}

interface Props {
  score: number;
  size?: 'sm' | 'md';
}

const ScorePill: React.FC<Props> = ({score, size = 'sm'}) => {
  const {bg, fg} = tierFor(score);
  return (
    <View style={[styles.pill, size === 'md' ? styles.pillMd : styles.pillSm, {backgroundColor: bg}]}>
      <StarIcon size={size === 'md' ? 13 : 11} color={fg} />
      <Text style={[styles.text, size === 'md' && styles.textMd, {color: fg}]}>
        {score.toFixed(1)} / 5
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    justifyContent: 'center',
  },
  pillSm: {height: 22, paddingHorizontal: 10},
  pillMd: {height: 24, paddingHorizontal: 11},
  text: {fontFamily: theme.fonts.bold, fontSize: 12},
  textMd: {fontSize: 12.5},
});

export default React.memo(ScorePill);
