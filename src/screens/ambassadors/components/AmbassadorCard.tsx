import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {formatCardDate, PersonChip, RecordCard, StatusPill} from '../../../components/ui';
import {Ambassador} from '../../../types/ambassador';
import {theme} from '../../../theme';

/** The handoff's own p2-act / p2-inact / p2-susp tokens. */
const STATUS_STYLE: Record<Ambassador['status'], {bg: string; fg: string}> = {
  Active: {bg: '#F1F9EC', fg: '#5C9B36'},
  'In-active': {bg: '#EEF0F2', fg: '#5B5F66'},
  Suspended: {bg: '#FFF2F0', fg: '#CF1322'},
};

function formatPoints(points: number): string {
  return `${points.toLocaleString('en-US')} pts`;
}

interface Props {
  ambassador: Ambassador;
  onPress: (ambassador: Ambassador) => void;
}

/**
 * The handoff's `card2`: points beside the status pill in the header's right
 * corner, a hairline, then Job Title / Total Work / Total Report in one row
 * and a full-width Last Logged In row underneath.
 */
const AmbassadorCard: React.FC<Props> = ({ambassador, onPress}) => {
  const style = STATUS_STYLE[ambassador.status];

  return (
    <RecordCard
      onPress={() => onPress(ambassador)}
      leading={<PersonChip name={ambassador.name} size={46} shape="rounded" avatarOnly />}
      idLabel={ambassador.name}
      subtitle={`ID ${ambassador.reference} - @${ambassador.username}`}
      statusPill={
        <View style={styles.headerRight}>
          <Text style={styles.points}>{formatPoints(ambassador.points)}</Text>
          <StatusPill label={ambassador.status} bg={style.bg} fg={style.fg} />
        </View>
      }
      fields={[
        {label: 'Job Title', value: ambassador.jobTitle},
        {label: 'Total Work', value: String(ambassador.totalWork)},
        {label: 'Total Report', value: String(ambassador.totalReports)},
      ]}
      secondaryFields={[
        {label: 'Last Logged In', value: formatCardDate(ambassador.lastLoggedIn)},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  points: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: '#20242A',
    fontVariant: ['tabular-nums'],
  },
});

export default React.memo(AmbassadorCard);
