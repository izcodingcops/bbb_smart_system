import React from 'react';
import {
  formatCardDateOnly,
  PersonChip,
  RecordCard,
  ScorePill,
  StatusPill,
} from '../../../components/ui';
import {RvpSiteVisit} from '../../../types/rvpSiteVisit';

/** The app's existing success/warning pairs, not new hex. */
const COMPLETE_STYLE = {bg: '#DCFCE7', fg: '#16A34A'};
const INCOMPLETE_STYLE = {bg: '#FFFBE6', fg: '#AD8B00'};

interface Props {
  visit: RvpSiteVisit;
  onPress: (visit: RvpSiteVisit) => void;
}

/**
 * The handoff's `card2`: the Operations Manager heads the card with the program
 * beneath, a completion pill opposite, and a six-cell grid under the rule.
 *
 * The design draws that grid three-up; `RecordCard` owns its own two-column
 * layout and no module overrides it, so the cells keep the design's reading
 * order and take the shell's shape.
 */
const RvpSiteVisitCard: React.FC<Props> = ({visit, onPress}) => {
  const style = visit.isComplete ? COMPLETE_STYLE : INCOMPLETE_STYLE;

  return (
    <RecordCard
      onPress={() => onPress(visit)}
      leading={<PersonChip name={visit.operationManager} size="lg" avatarOnly />}
      idLabel={visit.operationManager}
      statusPill={
        <StatusPill
          label={visit.isComplete ? 'Completed' : 'Incomplete'}
          bg={style.bg}
          fg={style.fg}
        />
      }
      dateLine={visit.program}
      fields={[
        {label: 'Reviewed By', node: <PersonChip name={visit.reviewedBy} />},
        {label: 'Start Date', value: formatCardDateOnly(visit.startDate)},
        {label: 'End Date', value: formatCardDateOnly(visit.endDate)},
        {label: 'Updated Date', value: formatCardDateOnly(visit.updatedAt)},
        {label: 'Updated By', node: <PersonChip name={visit.updatedBy} />},
        {label: 'Score', node: <ScorePill score={visit.avgScore} />},
      ]}
    />
  );
};

export default React.memo(RvpSiteVisitCard);
