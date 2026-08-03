import React, {useState} from 'react';
import {View, ScrollView, Text, StyleSheet} from 'react-native';
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
import {ClipboardCheckIcon} from '../../components/icons';
import {
  useDeleteWorkLogEntryMutation,
  useGetWorkLogEntryQuery,
  useUpdateWorkLogEntryMutation,
  useWorkLogFormOptionsQuery,
} from '../../graphql/features/workLog/hooks';
import {GetActiveProgram, GetShiftTypes} from '../../redux/auth/selectors';
import {WorkLogEntry, WorkLogFormValues, YesNo} from '../../types/workLog';
import WorkLogForm from './components/WorkLogForm';
import {theme} from '../../theme';
import {workLogCopy} from './shiftText';

function ynLabel(value: YesNo): string {
  return value === 'yes' ? 'Yes' : 'No';
}

/** Entry type and shift stay locked in edit mode — every other field is editable. */
function toFormValues(detail: WorkLogEntry): WorkLogFormValues {
  return {
    entryType: detail.entryType,
    machineNo: detail.machineNo,
    requestDateTime: detail.requestDateTime,
    fvmAccessibilityChecked: detail.fvmAccessibilityChecked,
    bridgePlateSecured: detail.bridgePlateSecured,
    accessibleFareGateWorking: detail.accessibleFareGateWorking,
    automaticDoorWorking: detail.automaticDoorWorking,
    fvmNotWorking: detail.fvmNotWorking,
    address: detail.address,
    zone: detail.zone,
    describeLocation: detail.describeLocation,
    businessName: detail.businessName,
    quantity: detail.quantity,
  };
}

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the caller can pop back and toast.
   *  shiftTypeName lets the caller build the toast via workLogCopy(). */
  onDeleted: (reference: string, shiftTypeName: string) => void;
}

const ViewWorkLogScreen: React.FC<Props> = ({id, onClose, onDeleted}) => {
  // Every hook runs before the early returns below — the loading, editing and
  // detail branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetWorkLogEntryQuery(id);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<WorkLogFormValues | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'danger';
  } | null>(null);
  const program = GetActiveProgram();
  const shiftTypes = GetShiftTypes();
  const {data: options} = useWorkLogFormOptionsQuery(detail?.shiftTypeId ?? '');
  const {mutate: update, isLoading: isUpdating} = useUpdateWorkLogEntryMutation();
  const {mutate: remove} = useDeleteWorkLogEntryMutation();

  if (isLoading) {
    // Matches the loaded screen's own sections: Basic Details (Type + Machine
    // No half, Request Date & Time full, 5 yes/no half, Status full),
    // Location Details (Address full, Zone + Business half, Describe
    // Location full, Quantity half), Submission (3 half).
    return (
      <DetailScreenSkeleton
        title="Work Log"
        onBack={onClose}
        sections={[
          ['half', 'half', 'full', 'half', 'half', 'half', 'half', 'half', 'full'],
          ['full', 'half', 'half', 'full', 'half'],
          ['half', 'half', 'half'],
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <View style={styles.root}>
        <DetailTopBar title="Work Log" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<ClipboardCheckIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this record"
            body="Something went wrong fetching it. Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </View>
      </View>
    );
  }

  const copy = workLogCopy(detail.shiftTypeName);
  const shiftTypeIcon =
    shiftTypes.find(t => t.id === detail.shiftTypeId)?.icon ?? 'general';

  // Edit replaces the detail in place, matching the design's slide-over.
  if (editing && options && editValues) {
    return (
      <View style={styles.root}>
        <WorkLogForm
          mode="edit"
          shiftTypeName={detail.shiftTypeName}
          shiftTypeIcon={shiftTypeIcon}
          reference={detail.reference}
          options={options}
          values={editValues}
          onChangeValues={setEditValues}
          submitLabel="Update"
          isSubmitting={isUpdating}
          onSubmit={async values => {
            await update(detail.id, values);
            setEditing(false);
            setToast({
              title: copy.updatedToastTitle,
              message: copy.updatedToastMessage(detail.reference),
            });
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DetailTopBar
        title={copy.viewTitle}
        reference={detail.reference}
        onBack={onClose}
        onEdit={() => {
          setEditValues(toFormValues(detail));
          setEditing(true);
        }}
        onDelete={() => setConfirmDelete(true)}
      />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.reference}</Text>
        </View>

        <DetailSection title="Basic Details">
          <DetailField label="Type" value={detail.entryType} />
          <DetailField label="Machine No" value={detail.machineNo} />
          <DetailField
            label="Request Date & Time"
            value={formatDateTime(detail.requestDateTime)}
            full
          />
          <DetailField
            label="FVM Accessibility Features Checked?"
            value={ynLabel(detail.fvmAccessibilityChecked)}
          />
          <DetailField
            label="Bridge Plate Secured When You Arrived?"
            value={ynLabel(detail.bridgePlateSecured)}
          />
          <DetailField
            label="Accessible Fare Gate Working?"
            value={ynLabel(detail.accessibleFareGateWorking)}
          />
          <DetailField
            label="Automatic Door Working?"
            value={ynLabel(detail.automaticDoorWorking)}
          />
          <DetailField label="FVM Not Working?" value={ynLabel(detail.fvmNotWorking)} />
          <DetailField label="Status" full>
            <StatusPill label="Completed" bg="#DCFCE7" fg="#16A34A" size="md" />
          </DetailField>
        </DetailSection>

        <DetailSection title="Location Details">
          <DetailField label="Address" value={detail.address} full />
          <DetailField label="Zone" value={detail.zone} />
          <DetailField label="Business Name" value={detail.businessName} />
          <DetailField
            label="Describe Location"
            value={detail.describeLocation}
            full
          />
          <DetailField label="Quantity" value={detail.quantity} />
        </DetailSection>

        <DetailSection title="Submission">
          <DetailField label="Logged By" value={detail.loggedBy} />
          <DetailField label="Program" value={program?.name} />
          <DetailField label="Sync Status" value="Synced" />
        </DetailSection>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title={copy.deleteDialogTitle}
        message={copy.deleteDialogMessage(detail.reference)}
        confirmLabel="Delete"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={async () => {
          try {
            await remove(detail.id);
            setConfirmDelete(false);
            onDeleted(detail.reference, detail.shiftTypeName);
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
});

export default ViewWorkLogScreen;
