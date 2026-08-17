import React, {useCallback, useMemo, useRef, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {
  ConfirmDialog,
  DetailScreenSkeleton,
  DetailTopBar,
  EmptyState,
  PersonChip,
  ScrollableTabs,
  StatusPill,
  Toast,
} from '../../components/ui';
import {MapPinIcon, StarIcon} from '../../components/icons';
import {
  useDeleteRvpSiteVisitMutation,
  useGetRvpSiteVisitQuery,
  useRvpSiteVisitFormOptionsQuery,
  useUpdateRvpSiteVisitMutation,
} from '../../graphql/features/rvpSiteVisit/hooks';
import BasicDetailsTab from './components/BasicDetailsTab';
import RvpSiteVisitForm, {buildEditValues} from './components/RvpSiteVisitForm';
import SectionTab from './components/SectionTab';
import {theme} from '../../theme';

const BASIC_TAB = 'basic';

/** The handoff's `truncLabel`: first two words plus an ellipsis when longer. */
function truncLabel(label: string): string {
  const words = label.trim().split(/\s+/);
  return words.length > 2 ? `${words.slice(0, 2).join(' ')}…` : label;
}

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the list can pop back and toast. */
  onDeleted: (reference: string) => void;
}

const ViewRvpSiteVisitScreen: React.FC<Props> = ({id, onClose, onDeleted}) => {
  // Every hook runs before the early returns below — the loading, error,
  // editing and loaded branches must not change hook order between renders.
  const {data: visit, isLoading, isError, refetch} = useGetRvpSiteVisitQuery(id);
  const [activeTab, setActiveTab] = useState(BASIC_TAB);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'danger';
  } | null>(null);
  const bodyRef = useRef<ScrollView>(null);
  const {data: options} = useRvpSiteVisitFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} = useUpdateRvpSiteVisitMutation();
  const {mutate: remove} = useDeleteRvpSiteVisitMutation();

  const tabs = useMemo(
    () => [
      {key: BASIC_TAB, label: truncLabel('Basic Details')},
      ...(visit?.sections ?? []).map(section => ({
        key: section.key,
        label: truncLabel(section.title),
      })),
    ],
    [visit],
  );

  // Switching tabs starts the new body at the top, as the design does —
  // otherwise a short section inherits a long one's scroll offset.
  const handleSelectTab = useCallback((key: string) => {
    setActiveTab(key);
    bodyRef.current?.scrollTo({y: 0, animated: false});
  }, []);

  if (isLoading) {
    // Matches the Basic Details tab: eight half-width cells with Reason for
    // Visit and Images spanning the grid.
    return (
      <DetailScreenSkeleton
        title="RVP Site Visit"
        onBack={onClose}
        sections={[
          ['half', 'half', 'half', 'half', 'full', 'half', 'half', 'half', 'half', 'full'],
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !visit) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="RVP Site Visit" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<MapPinIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this report"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </ScreenBackground>
    );
  }

  // Edit replaces the detail in place, matching the design's slide-over.
  if (editing && options) {
    return (
      <View style={styles.root}>
        <RvpSiteVisitForm
          mode="edit"
          reference={visit.reference}
          options={options}
          initialValues={buildEditValues(options, visit)}
          isSubmitting={isUpdating}
          onSubmit={async values => {
            await update(visit.id, values, options.sections);
            setEditing(false);
            setToast({
              title: 'Report updated',
              message: `${visit.reference} was saved successfully.`,
            });
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  const section = visit.sections.find(s => s.key === activeTab);

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar
        title="RVP Site Visit"
        reference={visit.reference}
        onBack={onClose}
        // Held back until the form options land, or Edit would open onto
        // nothing — the same guard the editing branch above applies.
        onEdit={options ? () => setEditing(true) : undefined}
        onDelete={() => setConfirmDelete(true)}
      />

      <View style={styles.hero}>
        <PersonChip name={visit.operationManager} size="lg" avatarOnly />
        <View style={styles.heroText}>
          <Text style={styles.heroName} numberOfLines={1}>
            {visit.operationManager}
          </Text>
          <Text style={styles.heroProgram} numberOfLines={1}>
            {visit.program}
          </Text>
          <View style={styles.heroScore}>
            <StarIcon size={13} color="#F5A623" />
            <Text style={styles.heroScoreValue}>{visit.score}</Text>
            <Text style={styles.heroScoreMax}>/ {visit.scoreMax}</Text>
            <Text style={styles.heroScoreLabel}>Total score</Text>
          </View>
        </View>
        <StatusPill
          label={visit.isComplete ? 'Completed' : 'Incomplete'}
          bg={visit.isComplete ? '#DCFCE7' : '#FFFBE6'}
          fg={visit.isComplete ? '#16A34A' : '#AD8B00'}
          size="md"
        />
      </View>

      <ScrollableTabs
        tabs={tabs}
        activeKey={activeTab}
        onSelect={handleSelectTab}
        style={styles.tabs}
      />

      <ScrollView ref={bodyRef} contentContainerStyle={styles.body}>
        {activeTab === BASIC_TAB || !section ? (
          <BasicDetailsTab visit={visit} />
        ) : (
          <SectionTab section={section} />
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this report?"
        message={
          <Text>
            This can't be undone.{' '}
            <Text style={styles.bold}>{visit.operationManager}</Text>{' '}
            (Operations Manager) will be notified that report{' '}
            <Text style={styles.bold}>{visit.reference}</Text> was deleted.
          </Text>
        }
        confirmLabel="Delete report"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={async () => {
          try {
            await remove(visit.id);
            setConfirmDelete(false);
            onDeleted(visit.reference);
          } catch {
            setConfirmDelete(false);
            setToast({
              title: "Couldn't delete",
              message: `${visit.reference} is still there. Check your connection and try again.`,
              variant: 'danger',
            });
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <Toast
        visible={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: theme.spacing.md,
  },
  heroText: {flex: 1, minWidth: 0, gap: 4},
  heroName: {
    fontFamily: theme.fonts.black,
    fontSize: 19,
    letterSpacing: -0.4,
    color: theme.colors.text,
  },
  heroProgram: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  heroScore: {flexDirection: 'row', alignItems: 'center', gap: 4},
  heroScoreValue: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  heroScoreMax: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#83909D',
  },
  heroScoreLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: '#6F7B85',
    marginLeft: 2,
  },
  tabs: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  body: {paddingBottom: 40},
  bold: {fontFamily: theme.fonts.black},
});

export default ViewRvpSiteVisitScreen;
