import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {
  AccordionSection,
  DetailField,
  detailGrid,
  formatDateTime,
} from '../../../components/ui';
import {ArrowRightIcon, CloudOffIcon} from '../../../components/icons';
import {DispatchIncident} from '../../../types/dispatch';
import {theme} from '../../../theme';

interface Props {
  incident: DispatchIncident;
  initiallyOpen?: boolean;
  /** Set on the incident the user just added, under the "Newly Added" band. */
  highlighted?: boolean;
  onViewMore: (incident: DispatchIncident) => void;
}

const IncidentAccordion: React.FC<Props> = ({
  incident,
  initiallyOpen,
  highlighted,
  onViewMore,
}) => (
  <AccordionSection
    title={incident.reference}
    subtitle={incident.label}
    initiallyOpen={initiallyOpen}
    highlighted={highlighted}>
    {incident.queuedOffline ? (
      <View style={styles.queuedRow}>
        <CloudOffIcon size={13} color="#C26401" />
        <Text style={styles.queued}>Queued · offline — not yet uploaded</Text>
      </View>
    ) : null}
    <View style={detailGrid}>
      <DetailField label="ID" value={incident.reference} />
      <DetailField label="Created By" value={incident.createdBy} />
      <DetailField label="Priority Level" value={incident.priority} />
      <DetailField label="Incident Type" value={incident.incidentType} />
      <DetailField label="Date & Time" value={formatDateTime(incident.occurredAt)} />
      <DetailField label="Outcome" value={incident.outcome} />
      <DetailField label="Source Notes" value={incident.notes} full />
    </View>

    <TouchableOpacity
      style={styles.viewMore}
      activeOpacity={0.85}
      onPress={() => {
        // A queued placeholder isn't in any store yet — its detail sheet
        // would just show the same summary again with nothing more to add.
        if (incident.queuedOffline) {
          Alert.alert(
            'Still uploading',
            "This incident hasn't finished uploading yet — full detail will be available once you're back online.",
          );
          return;
        }
        onViewMore(incident);
      }}>
      <Text style={styles.viewMoreText}>View More Detail</Text>
      <ArrowRightIcon size={16} color={theme.colors.primary} />
    </TouchableOpacity>
  </AccordionSection>
);

const styles = StyleSheet.create({
  queuedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: theme.spacing.md,
  },
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    marginTop: 18,
    marginBottom: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  viewMoreText: {
    fontFamily: theme.fonts.black,
    fontSize: 14.5,
    color: theme.colors.primary,
  },
});

export default React.memo(IncidentAccordion);
