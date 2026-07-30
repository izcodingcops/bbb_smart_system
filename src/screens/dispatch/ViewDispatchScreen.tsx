import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  DetailField,
  DetailSection,
  DetailTopBar,
  EmptyState,
  formatDateTime,
  formatDateTimeOrNull,
} from '../../components/ui';
import {PlusIcon, SendIcon} from '../../components/icons';
import {useGetDispatchQuery} from '../../graphql/features/dispatch/hooks';
import DispatchTabs, {DispatchTab} from './components/DispatchTabs';
import EscalationAccordion from './components/EscalationAccordion';
import IncidentAccordion from './components/IncidentAccordion';
import IncidentDetailSheet from './components/IncidentDetailSheet';
import {DispatchIncident} from '../../types/dispatch';
import {theme} from '../../theme';

const TABS: DispatchTab[] = [
  {value: 'dispatch', label: 'Dispatch'},
  {value: 'escalation', label: 'Escalation'},
  {value: 'incident', label: 'Incident'},
];

interface Props {
  id: string;
  onClose: () => void;
}

const ViewDispatchScreen: React.FC<Props> = ({id, onClose}) => {
  // Every hook runs before the early returns below — the loading, error and
  // loaded branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetDispatchQuery(id);
  const [tab, setTab] = useState('dispatch');
  const [openIncident, setOpenIncident] = useState<DispatchIncident | null>(null);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <DetailTopBar title="Dispatch Details" onBack={onClose} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <View style={styles.root}>
        <DetailTopBar title="Dispatch Details" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<SendIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this dispatch"
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
      <DetailTopBar
        title="Dispatch Details"
        reference={detail.reference}
        onBack={onClose}
      />

      <View style={styles.idRow}>
        <Text style={styles.idBig} numberOfLines={1}>
          {detail.reference}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          // Deferred seam: this opens the full Incident create form once the
          // Incident module exists. See the module design doc.
          onPress={() =>
            Alert.alert(
              'Coming soon',
              'Adding an incident from a dispatch is not wired up yet.',
            )
          }>
          <PlusIcon size={16} color={theme.colors.white} />
          <Text style={styles.addText}>Add Incident</Text>
        </TouchableOpacity>
      </View>

      <DispatchTabs tabs={TABS} value={tab} onChange={setTab} />

      <ScrollView contentContainerStyle={styles.body}>
        {tab === 'dispatch' ? (
          <>
            <DetailSection title="Basic Details">
              <DetailField label="How Referred" value={detail.howReferred} />
              <DetailField label="Created By" value={detail.createdBy} />
              <DetailField label="Date & Time" value={formatDateTime(detail.createdAt)} full />
              <DetailField label="Status" value={detail.status} />
              <DetailField label="Priority" value={detail.priority} />
              <DetailField label="Source Notes" value={detail.sourceNotes} full />
            </DetailSection>

            <DetailSection title="Location Details">
              <DetailField label="Location" value={detail.location} full />
              <DetailField label="Source Notes" value={detail.locationNotes} full />
            </DetailSection>

            <DetailSection title="Incident Classification">
              <DetailField label="Type of Activity" value={detail.typeOfActivity} />
              <DetailField label="Tag Selected" value={detail.tagSelected} />
              <DetailField label="Source Notes" value={detail.classificationNotes} full />
            </DetailSection>

            <DetailSection title="Assignment & Outcome">
              <DetailField label="Assigned Role" value={detail.assignedRole} />
              <DetailField label="Assigned Individual" value={detail.assignedIndividual} />
              <DetailField
                label="Time Dispatched"
                value={formatDateTimeOrNull(detail.timeDispatched)}
              />
              <DetailField label="Time Arrived" value={formatDateTimeOrNull(detail.timeArrived)} />
              <DetailField label="Time Cleared" value={formatDateTimeOrNull(detail.timeCleared)} />
              <DetailField label="Initial Outcome" value={detail.initialOutcome} />
              <DetailField label="Full Squad Response" value={detail.fullSquadResponse} />
              <DetailField label="Source Notes" value={detail.outcomeNotes} full />
            </DetailSection>
          </>
        ) : null}

        {tab === 'escalation' ? (
          detail.escalations.length > 0 ? (
            <View style={styles.accordions}>
              {detail.escalations.map((escalation, index) => (
                <EscalationAccordion
                  key={escalation.id}
                  escalation={escalation}
                  initiallyOpen={index === 0}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No Escalations</Text>
          )
        ) : null}

        {tab === 'incident' ? (
          detail.incidents.length > 0 ? (
            <View style={styles.accordions}>
              {detail.incidents.map((incident, index) => (
                <IncidentAccordion
                  key={incident.id}
                  incident={incident}
                  initiallyOpen={index === 0}
                  onViewMore={setOpenIncident}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No Incidents</Text>
          )
        ) : null}
      </ScrollView>

      <IncidentDetailSheet
        visible={openIncident !== null}
        incident={openIncident}
        onClose={() => setOpenIncident(null)}
      />
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
    backgroundColor: theme.colors.white,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  addText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.white,
  },
  accordions: {paddingBottom: theme.spacing.lg},
  empty: {
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingTop: 56,
  },
});

export default ViewDispatchScreen;
