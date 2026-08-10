import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {formatCardDate, RecordCard} from '../../../components/ui';
import {ObservationReport} from '../../../types/observationReport';
import ScorePill from './ScorePill';
import {theme} from '../../../theme';

/** The design uses stock photos; this app has none — same convention as PoiCard. */
function initials(name: string): string {
  return name
    .replace(/,/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

const PersonChip: React.FC<{name: string}> = ({name}) => (
  <View style={styles.personRow}>
    <View style={styles.personAvatar}>
      <Text style={styles.personAvatarText}>{initials(name)}</Text>
    </View>
    <Text style={styles.personName} numberOfLines={1}>{name}</Text>
  </View>
);

interface Props {
  report: ObservationReport;
  onPress: (report: ObservationReport) => void;
}

const ReportCard: React.FC<Props> = ({report, onPress}) => (
  <RecordCard
    onPress={() => onPress(report)}
    leading={
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(report.name)}</Text>
      </View>
    }
    idLabel={report.name}
    typeLabel={report.type}
    statusPill={<ScorePill score={report.score} />}
    dateLine={formatCardDate(report.date)}
    fields={[
      {label: 'Zone', value: report.zone},
      {label: 'Reviewed By', node: <PersonChip name={report.reviewedBy.name} />},
    ]}
    addressLabel="Observation Summary"
    addressValue={report.summary}
  />
);

const styles = StyleSheet.create({
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  avatarText: {fontFamily: theme.fonts.black, fontSize: 12, color: theme.colors.primary},
  personRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  personAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {fontFamily: theme.fonts.black, fontSize: 9, color: theme.colors.primary},
  personName: {fontFamily: theme.fonts.black, fontSize: 13, color: '#181B1F', flexShrink: 1},
});

export default React.memo(ReportCard);
