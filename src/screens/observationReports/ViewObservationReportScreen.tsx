import React, {useState} from 'react';
import {View, Text, Image, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import {
  ConfirmDialog,
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  PersonChip,
  ScorePill,
  Toast,
  formatDateTime,
} from '../../components/ui';
import {ClipboardCheckIcon} from '../../components/icons';
import {
  useDeleteObservationReportMutation,
  useGetObservationReportQuery,
  useObservationReportFormOptionsQuery,
  useUpdateObservationReportMutation,
} from '../../graphql/features/observationReport/hooks';
import ChecklistItem from './components/ChecklistItem';
import ObservationReportForm, {buildEditValues} from './components/ObservationReportForm';
import {theme} from '../../theme';

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the list can pop back and toast. */
  onDeleted: (reference: string) => void;
  /**
   * Suppresses Edit/Delete. The Ambassador module drills into a report as a
   * read-only record — the same report is still fully editable from its own
   * Observation Reports tab, this just doesn't expose that here.
   */
  readOnly?: boolean;
}

const ViewObservationReportScreen: React.FC<Props> = ({
  id,
  onClose,
  onDeleted,
  readOnly = false,
}) => {
  // Every hook runs before the early returns below — the loading, error,
  // editing and loaded branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetObservationReportQuery(id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'danger';
  } | null>(null);
  const {data: options} = useObservationReportFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} = useUpdateObservationReportMutation();
  const {mutate: remove} = useDeleteObservationReportMutation();

  if (isLoading) {
    // Report Details (4 fields, all half-width), the 5-row Checklist, and the
    // single-block Summary — the latter two aren't grids, so they're
    // approximated as stacks of full-width bones rather than left empty.
    return (
      <DetailScreenSkeleton
        title="Observation Report"
        onBack={onClose}
        sections={[
          ['half', 'half', 'half', 'half'],
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
      <ScreenBackground style={styles.root}>
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
      </ScreenBackground>
    );
  }

  // Edit replaces the detail in place, matching RVP's own slide-over.
  if (editing && options) {
    return (
      <View style={styles.root}>
        <ObservationReportForm
          mode="edit"
          reference={detail.reference}
          options={options}
          initialValues={buildEditValues(options, detail)}
          isSubmitting={isUpdating}
          onSubmit={async values => {
            await update(detail.id, values);
            setEditing(false);
            setToast({
              title: 'Observation updated',
              message: `${detail.reference} was updated.`,
            });
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar
        title="Observation Report"
        reference={detail.reference}
        onBack={onClose}
        // Held back until the form options land, or Edit would open onto
        // nothing — the same guard RVP's own detail screen applies.
        onEdit={!readOnly && options ? () => setEditing(true) : undefined}
        onDelete={readOnly ? undefined : () => setConfirmDelete(true)}
      />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <PersonChip name={detail.name} size={56} shape="rounded" avatarOnly />
          <View style={styles.idText}>
            <Text style={styles.idBig} numberOfLines={1}>
              {detail.name}
            </Text>
            <Text style={styles.idRef}>ID {detail.reference}</Text>
          </View>
          <ScorePill score={detail.score} size="md" />
        </View>

        <DetailSection title="Report Details">
          <DetailField label="Reviewed by">
            <PersonChip name={detail.reviewedBy.name} />
          </DetailField>
          <DetailField label="Zone" value={detail.zone} />
          <DetailField label="Date/Time Captured" value={formatDateTime(detail.dateTime)} />
          <DetailField label="Type" value={detail.type} />
          {detail.images.length > 0 ? (
            <DetailField label="Images" full>
              <View style={styles.thumbs}>
                {detail.images.map(uri => (
                  <Image key={uri} source={{uri}} style={styles.thumb} />
                ))}
              </View>
            </DetailField>
          ) : null}
        </DetailSection>

        <DetailSection title="Observation Checklist" grid={false}>
          {detail.checklist.map(c => (
            <ChecklistItem item={c} key={c.question} />
          ))}
        </DetailSection>

        <DetailSection title="Observation Summary" grid={false}>
          <View style={styles.summaryBox}>
            <Text style={styles.summary}>{detail.summary || 'No summary added'}</Text>
          </View>
        </DetailSection>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this observation report?"
        message={
          <Text>
            Report <Text style={styles.bold}>{detail.reference}</Text> for{' '}
            <Text style={styles.bold}>{detail.name}</Text> will be permanently deleted and{' '}
            {detail.name} will be notified. This action cannot be undone.
          </Text>
        }
        confirmLabel="Delete"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={async () => {
          try {
            await remove(detail.id);
            setConfirmDelete(false);
            onDeleted(detail.reference);
          } catch {
            setConfirmDelete(false);
            setToast({
              title: "Couldn't delete",
              message: `${detail.reference} is still there. Check your connection and try again.`,
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  idText: {flex: 1, minWidth: 0, gap: 4},
  idBig: {
    fontFamily: theme.fonts.black,
    fontSize: 21,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  idRef: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  summaryBox: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
  },
  summary: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
  },
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  thumb: {width: 64, height: 64, borderRadius: theme.radius.md},
  bold: {fontFamily: theme.fonts.black},
});

export default ViewObservationReportScreen;
