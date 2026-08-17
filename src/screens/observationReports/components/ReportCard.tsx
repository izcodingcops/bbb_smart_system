import React from 'react';
import {
  formatCardDate,
  PersonChip,
  RecordCard,
  ScorePill,
} from '../../../components/ui';
import {ObservationReport} from '../../../types/observationReport';

interface Props {
  report: ObservationReport;
  onPress: (report: ObservationReport) => void;
}

const ReportCard: React.FC<Props> = ({report, onPress}) => (
  <RecordCard
    onPress={() => onPress(report)}
    leading={<PersonChip name={report.name} size="lg" avatarOnly />}
    idLabel={report.name}
    typeLabel={report.type}
    statusPill={<ScorePill score={report.score} />}
    dateLine={formatCardDate(report.dateTime)}
    fields={[
      {label: 'Zone', value: report.zone},
      {label: 'Reviewed By', node: <PersonChip name={report.reviewedBy.name} />},
    ]}
    addressLabel="Observation Summary"
    addressValue={report.summary}
  />
);

export default React.memo(ReportCard);
