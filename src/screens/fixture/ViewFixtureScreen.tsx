import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ConfirmDialog, DetailField, StatusPill, Toast, formatDateTime} from '../../components/ui';
import {ChevronLeftIcon, EditIcon, TrashIcon} from '../../components/icons';
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
  const {data: detail, isLoading} = useGetFixtureQuery(id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updatedToast, setUpdatedToast] = useState(false);
  const {data: options} = useFixtureFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} = useUpdateFixtureMutation();
  const {mutate: remove} = useDeleteFixtureMutation();

  if (isLoading || !detail) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Edit replaces the detail in place, matching the design's slide-over.
  if (editing && options) {
    return (
      <View style={styles.root}>
        <FixtureForm
          mode="edit"
          reference={detail.id}
          options={options}
          initialValues={buildInitialValues(options, detail)}
          submitLabel="Update"
          isSubmitting={isUpdating}
          onSubmit={async values => {
            await update(detail.id, values);
            setEditing(false);
            setUpdatedToast(true);
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  const status = STATUS_STYLE[detail.status];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topbar}>
        <View style={styles.topbarRow}>
          <TouchableOpacity
            style={styles.topbarButton}
            activeOpacity={0.8}
            onPress={onClose}>
            <ChevronLeftIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={styles.topbarText}>
            <Text style={styles.topbarTitle}>Fixture</Text>
            <Text style={styles.topbarReference}>{detail.id}</Text>
          </View>
          <View style={styles.topbarActions}>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={() => setEditing(true)}>
              <EditIcon size={16} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.85}
              onPress={() => setConfirmDelete(true)}>
              <TrashIcon size={18} color="#CF1322" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <View style={styles.grid}>
            <DetailField label="Title" value={detail.title} />
            <DetailField label="Type" value={detail.fixtureType} />
            <DetailField label="Service Date & Time" value={formatDateTime(detail.createdAt)} />
            <DetailField label="Created By" value={detail.createdBy.name} />
            <DetailField label="Status" full>
              <StatusPill label={detail.status} bg={status.bg} fg={status.fg} size="md" />
            </DetailField>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <View style={styles.grid}>
            <DetailField label="Address" value={detail.address} />
            <DetailField label="Describe Location" value={detail.describeLocation} />
            <DetailField label="Latitude" value={detail.latitude} />
            <DetailField label="Longitude" value={detail.longitude} />
            <DetailField label="Zone" value={detail.zone} full />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Details</Text>
          <View style={styles.grid}>
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
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this fixture?"
        message={`Fixture ${detail.id} will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={async () => {
          setConfirmDelete(false);
          await remove(detail.id);
          onDeleted(detail.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <Toast
        visible={updatedToast}
        title="Fixture updated"
        message={`${detail.id} was saved successfully.`}
        onDismiss={() => setUpdatedToast(false)}
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
  topbar: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: theme.spacing.xs,
  },
  topbarButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F4',
  },
  topbarText: {flex: 1, minWidth: 0, paddingTop: 2},
  topbarTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: theme.colors.text,
  },
  topbarReference: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  topbarActions: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2},
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  editText: {fontFamily: theme.fonts.black, fontSize: 14, color: theme.colors.text},
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCCC7',
    backgroundColor: '#FFF2F0',
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
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  sectionTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 17.5,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 14},
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
