import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  formatCardDateOnly,
  PersonChip,
  RecordCard,
  StatusPill,
} from '../../../components/ui';
import {StarIcon} from '../../../components/icons';
import {RvpSiteVisit} from '../../../types/rvpSiteVisit';
import {theme} from '../../../theme';

/** The app's existing success/warning pairs, not new hex. */
const COMPLETE_STYLE = {bg: '#DCFCE7', fg: '#16A34A'};
const INCOMPLETE_STYLE = {bg: '#FFFBE6', fg: '#AD8B00'};

/**
 * The handoff's own `avgScoreCell` format: two decimals, except a whole number
 * drops to one ('4.40', '0.90', but '3.0'). Odd, and deliberate — it is what
 * the design prints.
 */
function formatAvgScore(score: number): string {
  return score.toFixed(2).replace(/\.00$/, '.0');
}

/**
 * The design's `c2-avgscore`: a star and the number, plain.
 *
 * Deliberately not `ScorePill` — the handoff defines a tinted `scoreCls`
 * helper but never calls it, and the card it actually draws has no pill and no
 * '/ 5'. The tinted pill belongs to Observation Reports.
 */
const AvgScore: React.FC<{score: number}> = ({score}) => (
  <View style={styles.scoreRow}>
    <StarIcon size={13} color="#F5A623" />
    <Text style={styles.scoreText}>{formatAvgScore(score)}</Text>
  </View>
);

interface Props {
  visit: RvpSiteVisit;
  onPress: (visit: RvpSiteVisit) => void;
}

/**
 * The handoff's `card2`: the Operations Manager and the program stacked beside
 * the avatar, a completion pill opposite, then six cells in **two rows of
 * three** under the rule.
 *
 * Six cells in one row is what `RecordCard` does by default — its grid is a
 * single row of equal columns — and at this width that truncates every date and
 * every name to an ellipsis. The split across `fields` and `secondaryFields` is
 * what gives the design's 3 x 2.
 */
const RvpSiteVisitCard: React.FC<Props> = ({visit, onPress}) => {
  const style = visit.isComplete ? COMPLETE_STYLE : INCOMPLETE_STYLE;

  return (
    <RecordCard
      onPress={() => onPress(visit)}
      leading={
        <PersonChip
          name={visit.operationManager}
          size={46}
          shape="rounded"
          avatarOnly
        />
      }
      idLabel={visit.operationManager}
      subtitle={visit.program}
      statusPill={
        <StatusPill
          label={visit.isComplete ? 'Completed' : 'Incomplete'}
          bg={style.bg}
          fg={style.fg}
        />
      }
      fields={[
        {label: 'Reviewed By', node: <PersonChip name={visit.reviewedBy} />},
        {label: 'Start Date', value: formatCardDateOnly(visit.startDate)},
        {label: 'End Date', value: formatCardDateOnly(visit.endDate)},
      ]}
      secondaryFields={[
        {label: 'Updated Date', value: formatCardDateOnly(visit.updatedAt)},
        {label: 'Updated By', node: <PersonChip name={visit.updatedBy} />},
        {label: 'Score', node: <AvgScore score={visit.avgScore} />},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  scoreRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  scoreText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.textOnGlass,
  },
});

export default React.memo(RvpSiteVisitCard);
