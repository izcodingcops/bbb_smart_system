import React, {useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ScreenBackground from '../../components/ScreenBackground';
import {
  ConfirmDialog,
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  StatusPill,
  Toast,
  detailGrid,
  formatDateTimeOrNull,
} from '../../components/ui';
import {CloudOffIcon} from '../../components/icons';
import {
  useDeleteEquipmentMutation,
  useEquipmentFormOptionsQuery,
  useGetEquipmentDetailQuery,
  useUpdateEquipmentMutation,
} from '../../graphql/features/equipment/hooks';
import {EquipmentStatus} from '../../types/equipment';
import EquipmentDetailTabs from './components/EquipmentDetailTabs';
import EquipmentForm, {buildInitialValues} from './components/EquipmentForm';
import EquipmentFormError from './components/EquipmentFormError';
import UpkeepList from './components/UpkeepList';
import {useQueuedEquipmentIds} from './pendingEquipmentItems';
import {EquipmentStackParamList} from './routes';
import {theme} from '../../theme';

const STATUS_STYLE: Record<EquipmentStatus, {bg: string; fg: string}> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  'Checked-Out': {bg: '#E6F4FF', fg: '#0066B2'},
};

const DETAIL_TABS = [
  {key: 'equipment', label: 'Equipment Details'},
  {key: 'upkeep', label: 'Upkeep Details'},
];

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the list can pop back and toast. */
  onDeleted: (reference: string) => void;
  onCheckOut: (id: string) => void;
  onCheckIn: (id: string) => void;
  onAddUpkeep: (id: string) => void;
}

const ViewEquipmentScreen: React.FC<Props> = ({
  id,
  onClose,
  onDeleted,
  onCheckOut,
  onCheckIn,
  onAddUpkeep,
}) => {
  // Every hook runs before the early returns below — the loading, error,
  // editing and loaded branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetEquipmentDetailQuery(id);
  const queuedEquipmentIds = useQueuedEquipmentIds();
  const [tab, setTab] = useState('equipment');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'danger';
  } | null>(null);
  const {data: options} = useEquipmentFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} = useUpdateEquipmentMutation();
  const {mutate: remove} = useDeleteEquipmentMutation();
  const route = useRoute<RouteProp<EquipmentStackParamList, 'EquipmentView'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<EquipmentStackParamList, 'EquipmentView'>>();

  // Add Upkeep hands this screen an initial tab when it pops back here after
  // a successful submit. Applied via an effect rather than a useState
  // initialiser because this screen stays mounted underneath the form —
  // a second visit would never re-run initial state. Mirrors EquipmentScreen's
  // own initialTab handling.
  const incomingTab = route.params?.initialTab;
  useEffect(() => {
    if (!incomingTab) {
      return;
    }
    setTab(incomingTab);
    navigation.setParams({initialTab: undefined});
  }, [incomingTab, navigation]);

  if (isLoading) {
    return (
      <DetailScreenSkeleton
        title="Equipment"
        onBack={onClose}
        sections={[
          ['half', 'half', 'half', 'half', 'half', 'half', 'full'],
          ['half', 'half'],
          ['half', 'half', 'half'],
        ]}
      />
    );
  }

  // Shares the three form screens' failed-load branch — it already carries the
  // back affordance this route needs, the tab bar being hidden here.
  if (isError || !detail) {
    return (
      <EquipmentFormError title="Equipment" onClose={onClose} onRetry={refetch} />
    );
  }

  // Edit replaces the detail body in place rather than pushing a route,
  // matching ViewPoiScreen. Guarded on `options` so a tap landing before the
  // dropdown contents arrive falls through to the detail instead of rendering
  // a form with empty pickers.
  if (editing && options) {
    return (
      <View style={styles.root}>
        <EquipmentForm
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
              title: 'Equipment updated',
              message: `${detail.reference} was saved successfully.`,
            });
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  const status = STATUS_STYLE[detail.status];
  // A queued custody mutation (check-out/check-in/add upkeep) for this record
  // hasn't synced yet, so `detail.mine`/`detail.status` are stale — firing
  // another custody action here would queue a second mutation on top of the
  // first with no feedback to the user. Mirrors EquipmentCard's list-row
  // treatment (src/screens/equipment/components/EquipmentCard.tsx).
  const queued = queuedEquipmentIds.has(detail.id);

  const basicDetails = (
    <DetailSection title="Basic Details">
      <View style={detailGrid}>
        <DetailField label="Type of Equipment" value={detail.equipmentType} />
        <DetailField label="Name" value={detail.name} />
        <DetailField label="Model" value={detail.model} />
        <DetailField label="Make" value={detail.make} />
        <DetailField
          label="Date Acquired"
          value={formatDateTimeOrNull(detail.acquiredAt)}
        />
        <DetailField label="Category" value={detail.category} />
        <DetailField label="Usage Type" value={detail.unit} />
        <DetailField label="Serial / Vehicle No." value={detail.serial} />
        <DetailField label="Beg. Miles/Hours" value={detail.beginningUsage} />
        <DetailField label="Year" value={detail.year} />
        <DetailField label="Zone" value={detail.zone} />
        <DetailField label="Status">
          <StatusPill label={detail.status} bg={status.bg} fg={status.fg} size="md" />
        </DetailField>
        <DetailField label="Ownership Status" value={detail.ownership} />
        <DetailField label="Description" value={detail.description} full />
      </View>
    </DetailSection>
  );

  const checkoutActivity = (
    <DetailSection title="Checkout Activity">
      <View style={detailGrid}>
        <DetailField
          label="User Checkout"
          value={detail.mine ? 'Me' : detail.checkedOutBy}
        />
        <DetailField
          label="Last Checkout"
          value={formatDateTimeOrNull(detail.checkedOutAt)}
        />
      </View>
    </DetailSection>
  );

  const connectedAssets = (
    <DetailSection title="Connected Assets">
      <View style={detailGrid}>
        <DetailField
          label="Incidents"
          value={detail.incidents.length ? detail.incidents.join(', ') : null}
        />
        <DetailField
          label="Persons of Interest"
          value={
            detail.personsOfInterest.length
              ? detail.personsOfInterest.join(', ')
              : null
          }
        />
        <DetailField
          label="Maintenance"
          value={detail.maintenance.length ? detail.maintenance.join(', ') : null}
        />
      </View>
    </DetailSection>
  );

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar
        title="Equipment"
        reference={detail.serial}
        onBack={onClose}
        /*
         * Both are omitted outright while queued, not rendered disabled: the
         * record's local state is stale until the outbox drains, an edit would
         * be written over by the syncing mutation, and a delete would strand
         * that mutation to dead-letter silently — nothing in this app surfaces
         * outbox.failed. A greyed Edit with no explanation reads as a bug,
         * whereas the "Queued · offline" chip below already says why the
         * actions are gone.
         */
        onEdit={queued ? undefined : () => setEditing(true)}
        onDelete={queued ? undefined : () => setConfirmDelete(true)}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.reference}</Text>
          {queued ? (
            <View style={styles.queuedRow}>
              <CloudOffIcon size={13} color="#C26401" />
              <Text style={styles.queuedText}>Queued · offline</Text>
            </View>
          ) : null}
          <View style={styles.idActions}>
            {detail.mine ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.idAction,
                    styles.idActionGhost,
                    queued && styles.idActionDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={queued}
                  onPress={() => onAddUpkeep(detail.id)}>
                  <Text style={styles.idActionGhostText}>Add Upkeep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.idAction,
                    styles.idActionSolid,
                    queued && styles.idActionDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={queued}
                  onPress={() => onCheckIn(detail.id)}>
                  <Text style={styles.idActionSolidText}>Check-In</Text>
                </TouchableOpacity>
              </>
            ) : detail.status === 'Active' ? (
              <TouchableOpacity
                style={[
                  styles.idAction,
                  styles.idActionSolid,
                  queued && styles.idActionDisabled,
                ]}
                activeOpacity={0.85}
                disabled={queued}
                onPress={() => onCheckOut(detail.id)}>
                <Text style={styles.idActionSolidText}>Check-Out Equipment</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {detail.mine ? (
          <>
            <View style={styles.tabsWrap}>
              <EquipmentDetailTabs
                tabs={DETAIL_TABS}
                activeKey={tab}
                onSelect={setTab}
              />
            </View>
            {tab === 'upkeep' ? (
              <UpkeepList upkeeps={detail.upkeeps} />
            ) : (
              <>
                {basicDetails}
                {checkoutActivity}
                {connectedAssets}
              </>
            )}
          </>
        ) : (
          <>
            {basicDetails}
            {connectedAssets}
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        title="Delete this equipment?"
        message={`Equipment ${detail.reference} will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await remove(detail.id);
            setConfirmDelete(false);
            // The reference, not the id — the list's toast displays it.
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
  body: {paddingBottom: theme.spacing.xxl},
  idRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  idBig: {
    fontFamily: theme.fonts.black,
    fontSize: 24,
    letterSpacing: -0.4,
    color: theme.colors.textOnGlass,
  },
  idActions: {flexDirection: 'row', gap: theme.spacing.sm},
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queuedText: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  idAction: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  idActionDisabled: {opacity: 0.45},
  idActionGhost: {
    borderWidth: 1.5,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.glass.buttonFill,
  },
  idActionGhostText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
  idActionSolid: {backgroundColor: theme.colors.primary},
  idActionSolidText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.white,
  },
  tabsWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
});

export default ViewEquipmentScreen;
