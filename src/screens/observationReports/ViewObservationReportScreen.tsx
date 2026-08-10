import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  formatDateTime,
} from '../../components/ui';
import {ClipboardCheckIcon} from '../../components/icons';
import {useGetObservationReportQuery} from '../../graphql/features/observationReport/hooks';
import ChecklistItem from './components/ChecklistItem';
import ScorePill from './components/ScorePill';
import {theme} from '../../theme';

/** Same convention as ReportCard's PersonChip — the design uses stock photos, this app has none. */
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

interface Props {
  id: string;
  onClose: () => void;
}

const ViewObservationReportScreen: React.FC<Props> = ({id, onClose}) => {
  // Only hook in this component — runs before every early return below.
  const {data: detail, isLoading, isError, refetch} = useGetObservationReportQuery(id);

  if (isLoading) {
    // Report Details (4 fields), the 5-row Checklist, and the single-block
    // Summary — the latter two aren't grids, so they're approximated as
    // stacks of full-width bones rather than left empty.
    return (
      <DetailScreenSkeleton
        title="Observation Report"
        onBack={onClose}
        sections={[
          ['half', 'half', 'full', 'half'],
          ['full', 'full', 'full', 'full', 'full'],
          ['full'],
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <View style={styles.root}>
        <DetailTopBar title="Observation Report" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this report"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DetailTopBar title="Observation Report" reference={detail.reference} onBack={onClose} />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.name}</Text>
          <ScorePill score={detail.score} size="md" />
        </View>

        <DetailSection title="Report Details">
          <DetailField label="Zone" value={detail.zone} />
          <DetailField label="Reviewed by">
            <View style={styles.personRow}>
              <View style={styles.personAvatar}>
                <Text style={styles.personAvatarText}>{initials(detail.reviewedBy.name)}</Text>
              </View>
              <Text style={styles.personName} numberOfLines={1}>
                {detail.reviewedBy.name}
              </Text>
            </View>
          </DetailField>
          <DetailField label="Date/Time Captured" value={formatDateTime(detail.dateTime)} full />
          <DetailField label="Type" value={detail.type} />
        </DetailSection>

        <DetailSection title="Observation Checklist" grid={false}>
          {detail.checklist.map(c => (
            <ChecklistItem item={c} key={c.question} />
          ))}
        </DetailSection>

        <DetailSection title="Observation Summary" grid={false}>
          <Text style={styles.summary}>{detail.summary || 'No summary added'}</Text>
        </DetailSection>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  body: {paddingBottom: 40},
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 18,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  idBig: {
    flex: 1,
    fontFamily: theme.fonts.black,
    fontSize: 25,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
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
  summary: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
  },
});

export default ViewObservationReportScreen;
