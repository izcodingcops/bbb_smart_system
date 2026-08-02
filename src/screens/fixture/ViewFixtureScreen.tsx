import React, {useState} from 'react';
import {View, Text, ScrollView, Image, StyleSheet} from 'react-native';
import {
  ConfirmDialog,
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  StatusPill,
  Toast,
  formatDateTime,
} from '../../components/ui';
import {BoxIcon} from '../../components/icons';
import {
  useDeleteFixtureMutation,
  useFixtureFormOptionsQuery,
  useGetFixtureQuery,
  useUpdateFixtureMutation,
} from '../../graphql/features/fixture/hooks';
import {FixtureStatus} from '../../types/fixture';
import FixtureForm, {buildInitialValues} from './components/FixtureForm';
import {theme} from '../../theme';

const STATUS_STYLE: Record<FixtureStatus, {bg: string; fg: string}> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  Inactive: {bg: '#F1F3F5', fg: '#475467'},
};

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the list can pop back and toast. */
  onDeleted: (reference: string) => void;
}

const ViewFixtureScreen: React.FC<Props> = ({id, onClose, onDeleted}) => {
  // Every hook runs before the early returns below — the loading, editing and
  // detail branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetFixtureQuery(id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'danger';
  } | null>(null);
  const {data: options} = useFixtureFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} = useUpdateFixtureMutation();
  const {mutate: remove} = useDeleteFixtureMutation();

  if (isLoading) {
    // Matches the loaded screen's own sections: Basic Details (4 half fields
    // + Status full-width), Location Details (4 half + Zone full-width),
    // Other Details (2, both full-width).
    return (
      <DetailScreenSkeleton
        title="Fixture"
        onBack={onClose}
        sections={[
          ['half', 'half', 'half', 'half', 'full'],
          ['half', 'half', 'half', 'half', 'full'],
          ['full', 'full'],
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <View style={styles.root}>
        <DetailTopBar title="Fixture" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<BoxIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this fixture"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </View>
    );
  }

  // Edit replaces the detail in place, matching the design's slide-over.
  if (editing && options) {
    return (
      <View style={styles.root}>
        <FixtureForm
          mode="edit"
          reference={detail.reference}
          options={options}
          initialValues={buildInitialValues(options, detail)}
          submitLabel="Update"
          isSubmitting={isUpdating}
          onSubmit={async values => {
            await update(detail.id, values);
            setEditing(false);
            setToast({
              title: 'Fixture updated',
              message: `${detail.reference} was saved successfully.`,
            });
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  const status = STATUS_STYLE[detail.status];

  return (
    <View style={styles.root}>
      <DetailTopBar
        title="Fixture"
        reference={detail.reference}
        onBack={onClose}
        onEdit={() => setEditing(true)}
        onDelete={() => setConfirmDelete(true)}
      />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.reference}</Text>
        </View>

        <DetailSection title="Basic Details">
          <DetailField label="Title" value={detail.title} />
          <DetailField label="Type" value={detail.fixtureType} />
          <DetailField label="Service Date & Time" value={formatDateTime(detail.createdAt)} />
          <DetailField label="Created By" value={detail.createdBy.name} />
          <DetailField label="Status" full>
            <StatusPill label={detail.status} bg={status.bg} fg={status.fg} size="md" />
          </DetailField>
        </DetailSection>

        <DetailSection title="Location Details">
          <DetailField label="Address" value={detail.address} />
          <DetailField label="Describe Location" value={detail.describeLocation} />
          <DetailField label="Latitude" value={detail.latitude} />
          <DetailField label="Longitude" value={detail.longitude} />
          <DetailField label="Zone" value={detail.zone} full />
        </DetailSection>

        <DetailSection title="Other Details">
          <DetailField label="Description" value={detail.description} full />
          <DetailField label="Document" full>
            {detail.documents.length > 0 ? (
              <View style={styles.thumbs}>
                {detail.documents.map(uri => (
                  <Image key={uri} source={{uri}} style={styles.thumb} />
                ))}
              </View>
            ) : undefined}
          </DetailField>
        </DetailSection>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this fixture?"
        message={`Fixture ${detail.reference} will be permanently deleted. This action cannot be undone.`}
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
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 2},
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
});

export default ViewFixtureScreen;
