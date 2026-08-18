import React from 'react';
import {StyleSheet} from 'react-native';
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
    leading={
      <PersonChip name={report.name} size={34} avatarOnly style={styles.leading} />
    }
    idLabel={report.name}
    typeLabel={report.type}
    statusPill={<ScorePill score={report.score} />}
    dateLine={formatCardDate(report.dateTime)}
    fields={[
      {label: 'Report No', value: report.reference},
      {label: 'Zone', value: report.zone},
      {label: 'Reviewed By', node: <PersonChip name={report.reviewedBy.name} />},
    ]}
    addressLabel="Observation Summary"
    addressValue={report.summary}
  />
);

/** Preserves the 2px this card's avatar carried before PersonChip owned it. */
const styles = StyleSheet.create({leading: {marginRight: 2}});

export default React.memo(ReportCard);
