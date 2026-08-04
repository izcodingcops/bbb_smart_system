import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  DetailField,
  DetailSection,
  DetailTopBar,
  EmptyState,
  Toast,
  formatDateTime,
  formatDateTimeOrNull,
} from '../../components/ui';
import {PlusIcon, SendIcon} from '../../components/icons';
import {useGetDispatchQuery} from '../../graphql/features/dispatch/hooks';
import CreateDispatchIncidentScreen from './CreateDispatchIncidentScreen';
import DispatchTabs, {DispatchTab, DispatchTabKey} from './components/DispatchTabs';
import EscalationAccordion from './components/EscalationAccordion';
import IncidentAccordion from './components/IncidentAccordion';
import IncidentDetailSheet from './components/IncidentDetailSheet';
import {usePendingDispatchIncidents} from './pendingDispatchIncidents';
import {DispatchIncident} from '../../types/dispatch';
import {theme} from '../../theme';

const TABS: DispatchTab[] = [
  {value: 'dispatch', label: 'Dispatch'},
  {value: 'escalation', label: 'Escalation'},
  {value: 'incident', label: 'Incident'},
];

/** Add Incident is a full-screen push within the detail screen. */
type DetailRoute = {name: 'detail'} | {name: 'addIncident'};

interface ToastState {
  title: string;
  message: string;
  variant: 'success' | 'danger';
}

interface Props {
  id: string;
  onClose: () => void;
}

const ViewDispatchScreen: React.FC<Props> = ({id, onClose}) => {
  // Every hook runs before the early returns below — the loading, error and
  // loaded branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetDispatchQuery(id);
  const pendingIncidents = usePendingDispatchIncidents(id);
  const [tab, setTab] = useState<DispatchTabKey>('dispatch');
  const [openIncident, setOpenIncident] = useState<DispatchIncident | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [route, setRoute] = useState<DetailRoute>({name: 'detail'});
  /** The incident just added, shown under a "Newly Added" band until the user leaves the tab. */
  const [justAdded, setJustAdded] = useState<
    {id: string; label: string; queued: boolean} | null
  >(null);
  /**
   * Snapshotted at onCreated rather than derived from `justAdded` — that
   * state gets nulled by handleTabChange as soon as the user leaves the
   * Incident tab, which would otherwise flip a still-visible "queued"
   * toast over to a false "attached" one mid-display.
   */
  const [toast, setToast] = useState<ToastState | null>(null);

  // Wrapped in useCallback: DispatchTabs is React.memo'd, so a fresh inline
  // arrow passed as onChange on every render would defeat that memo.
  const handleTabChange = useCallback((next: DispatchTabKey) => {
    setTab(next);
    if (next !== 'incident') {
      setJustAdded(null);
    }
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, []);

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

  if (route.name === 'addIncident') {
    return (
      <CreateDispatchIncidentScreen
        dispatchId={id}
        onClose={() => setRoute({name: 'detail'})}
        onCreated={created => {
          setRoute({name: 'detail'});
          setJustAdded({id: created.id, label: created.label, queued: created.queued});
          setTab('incident');
          setToast(
            created.queued
              ? {
                  title: 'Saved — will upload when back online',
                  message:
                    "This incident is queued and will upload automatically once you're back online.",
                  variant: 'danger',
                }
              : {
                  title: 'Incident added',
                  message: `${created.label} was attached to this dispatch.`,
                  variant: 'success',
                },
          );
          // No explicit refetch() here — CREATE_CONTEXT (src/graphql/features/
          // dispatch/hooks.ts) already declares refetchQueries: ['GetDispatch'],
          // and useGetDispatchQuery keeps that query active the whole time
          // since it's called above every early return in this component, so
          // the declarative refetch alone covers it.
        }}
      />
    );
  }

  // Derived, not state: split out the just-added incident (if it has actually
  // landed in `detail.incidents` yet) from the rest. Kept as exact complements
  // so no incident renders twice and none disappears while these diverge —
  // e.g. right after an online create, before refetch() resolves, or for an
  // offline create whose synthetic outbox id never matches a real incident.
  const newlyAdded = justAdded
    ? detail.incidents.filter(incident => incident.id === justAdded.id)
    : [];
  const rest = detail.incidents.filter(incident => incident.id !== justAdded?.id);

  return (
    <View style={styles.root}>
      <DetailTopBar title="Dispatch Details" onBack={onClose} />

      <View style={styles.idRow}>
        <Text style={styles.idBig} numberOfLines={1}>
          {detail.reference}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => setRoute({name: 'addIncident'})}>
          <PlusIcon size={16} color={theme.colors.white} />
          <Text style={styles.addText}>Add Incident</Text>
        </TouchableOpacity>
      </View>

      <DispatchTabs tabs={TABS} value={tab} onChange={handleTabChange} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.body}>
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
          detail.incidents.length > 0 || pendingIncidents.length > 0 ? (
            <View style={styles.accordions}>
              {newlyAdded.length > 0 ? (
                <>
                  <Text style={styles.newBand}>Newly Added</Text>
                  {newlyAdded.map(incident => (
                    <IncidentAccordion
                      key={incident.id}
                      incident={incident}
                      initiallyOpen
                      highlighted
                      onViewMore={setOpenIncident}
                    />
                  ))}
                </>
              ) : null}
              {pendingIncidents.length > 0 ? (
                <>
                  <Text style={styles.newBand}>Pending Upload</Text>
                  {pendingIncidents.map(incident => (
                    <IncidentAccordion
                      key={incident.id}
                      incident={incident}
                      initiallyOpen
                      highlighted
                      onViewMore={setOpenIncident}
                    />
                  ))}
                </>
              ) : null}
              {rest.map((incident, index) => (
                <IncidentAccordion
                  key={incident.id}
                  incident={incident}
                  initiallyOpen={
                    newlyAdded.length === 0 && pendingIncidents.length === 0 && index === 0
                  }
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

      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
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
  newBand: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  empty: {
    fontFamily: theme.fonts.bold,
    fontSize: 14.5,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingTop: 56,
  },
});

export default ViewDispatchScreen;
