import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import {
  CommentList,
  CommentSheet,
  ConfirmDialog,
  DetailField,
  DetailScreenSkeleton,
  DetailSection,
  DetailTopBar,
  EmptyState,
  PriorityPill,
  StatusPill,
  Toast,
  formatDateTime,
} from '../../components/ui';
import {
  MessageSquareIcon,
  ToolsIcon,
  UserPlusIcon,
  UsersIcon,
} from '../../components/icons';
import ScreenBackground from '../../components/ScreenBackground';
import {
  useAddMaintenanceCommentMutation,
  useDeleteMaintenanceCommentMutation,
  useDeleteMaintenanceRequestMutation,
  useGetMaintenanceRequestQuery,
  useMaintenanceFormOptionsQuery,
  useUpdateMaintenanceCommentMutation,
  useUpdateMaintenanceRequestMutation,
} from '../../graphql/features/maintenance/hooks';
import {
  MaintenanceComment,
  MaintenancePriority,
  MaintenanceStatus,
  isUnassignedMaintenance,
} from '../../types/maintenance';
import {GetUserRole} from '../../redux/auth/selectors';
import AssigneeSheet, {AssignTarget} from './components/AssigneeSheet';
import AddEquipmentSheet from './components/AddEquipmentSheet';
import AddFixtureSheet from './components/AddFixtureSheet';
import AddIncidentSheet from './components/AddIncidentSheet';
import MaintenanceForm, {buildInitialValues} from './components/MaintenanceForm';
import {theme} from '../../theme';

const STATUS_STYLE: Record<MaintenanceStatus, {bg: string; fg: string}> = {
  Open: {bg: '#F1F3F5', fg: '#475467'},
  'In-progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

const PRIORITY_STYLE: Record<MaintenancePriority, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the list can pop back and toast. */
  onDeleted: (reference: string) => void;
}

const ViewMaintenanceScreen: React.FC<Props> = ({id, onClose, onDeleted}) => {
  // Every hook runs before the early returns below — the loading, editing and
  // detail branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetMaintenanceRequestQuery(id);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [editingComment, setEditingComment] =
    useState<MaintenanceComment | null>(null);
  const [deletingComment, setDeletingComment] =
    useState<MaintenanceComment | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Non-null while the Choose Assignee sheet is up — supervisors only. */
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const role = GetUserRole() ?? 'ambassador';
  const [addFixtureOpen, setAddFixtureOpen] = useState(false);
  const [addEquipmentOpen, setAddEquipmentOpen] = useState(false);
  // Holds the form's current address while the sheet is up — null when closed.
  const [incidentAddress, setIncidentAddress] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'danger';
  } | null>(null);
  const {mutate: addComment} = useAddMaintenanceCommentMutation();
  const {mutate: updateComment} = useUpdateMaintenanceCommentMutation();
  const {mutate: deleteComment} = useDeleteMaintenanceCommentMutation();
  const {data: options, refetch: refetchOptions} =
    useMaintenanceFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} =
    useUpdateMaintenanceRequestMutation();
  const {mutate: remove} = useDeleteMaintenanceRequestMutation();

  if (isLoading) {
    // Matches the loaded screen's own sections: Basic Details (10 fields),
    // Other Details (2, both full-width), Location Details (3), Connected
    // Elements (4) — plus the id row's "Add comment" button.
    return (
      <DetailScreenSkeleton
        title="Maintenance"
        onBack={onClose}
        showCommentButton
        sections={[
          Array(10).fill('half'),
          ['full', 'full'],
          ['full', 'half', 'half'],
          Array(4).fill('half'),
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Maintenance" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<ToolsIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this request"
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
        <MaintenanceForm
          key={options.fixtures.length}
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
              title: 'Maintenance updated',
              message: `${detail.reference} was saved successfully.`,
            });
          }}
          onClose={() => setEditing(false)}
          onAddFixture={() => setAddFixtureOpen(true)}
          onAddIncident={address => setIncidentAddress(address)}
          onAddEquipment={() => setAddEquipmentOpen(true)}
        />

        <AddFixtureSheet
          visible={addFixtureOpen}
          options={options}
          onCreated={() => refetchOptions()}
          onClose={() => setAddFixtureOpen(false)}
        />

        <AddIncidentSheet
          visible={incidentAddress !== null}
          defaultAddress={incidentAddress ?? ''}
          onCreated={() => refetchOptions()}
          onClose={() => setIncidentAddress(null)}
        />

        <AddEquipmentSheet
          visible={addEquipmentOpen}
          onCreated={() => refetchOptions()}
          onClose={() => setAddEquipmentOpen(false)}
        />
      </View>
    );
  }

  const status = STATUS_STYLE[detail.status];
  // Exactly the records Work's Unassigned tab lists, and only a supervisor can
  // clear one — an ambassador routes work upward, never onto a named person.
  const canAssign = role === 'supervisor' && isUnassignedMaintenance(detail);

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar
        title="Maintenance"
        reference={detail.reference}
        onBack={onClose}
        onEdit={() => setEditing(true)}
        onDelete={() => setConfirmDelete(true)}
      />

      <ScrollView contentContainerStyle={styles.body}>
        {/* Wraps rather than squeezing: the reference plus both chips overflow
            392pt, so on an unassigned record the actions drop to their own line
            instead of the labels truncating. */}
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.reference}</Text>
          <View style={styles.idActions}>
            {canAssign ? (
              <TouchableOpacity
                style={styles.assignButton}
                activeOpacity={0.85}
                onPress={() => setAssignTarget(detail)}>
                <UserPlusIcon size={17} color={theme.colors.primary} />
                <Text style={styles.assignButtonText}>Choose assignee</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.commentButton}
              activeOpacity={0.85}
              onPress={() => {
                setEditingComment(null);
                setCommentSheetOpen(true);
              }}>
              <MessageSquareIcon size={17} />
              <Text style={styles.commentButtonText}>Add comment</Text>
            </TouchableOpacity>
          </View>
        </View>

        <DetailSection title="Basic Details">
          {/* Branch on `assignee` before `assigneeKind`: the kind records the
              routing choice and can lag behind a record that already has
              someone on it. Order mirrors toMaintenanceWorkItem's own assignee
              fallback so the card and this screen can never disagree. */}
          <DetailField label="Assigned To">
            {detail.assignee ? (
              <View style={styles.withAvatar}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {detail.assignee.initials}
                  </Text>
                </View>
                <Text style={styles.fieldValue}>{detail.assignee.name}</Text>
              </View>
            ) : detail.department ? (
              <View style={styles.withAvatar}>
                {/* A glyph, not initials — a department isn't a person. */}
                <View style={styles.departmentAvatar}>
                  <UsersIcon size={15} color={theme.colors.primary} />
                </View>
                <Text style={styles.fieldValue}>{detail.department}</Text>
              </View>
            ) : (
              <Text style={[styles.fieldValue, styles.fieldValueEmpty]}>
                Unassigned
              </Text>
            )}
          </DetailField>
          <DetailField label="Type" value={detail.type} />
          <DetailField label="Program Name">
            <Text style={styles.fieldValue}>
              {detail.programName}
              {'\n'}
              {detail.programCode}
            </Text>
          </DetailField>
          <DetailField label="Priority">
            <PriorityPill
              label={detail.priority}
              bg={PRIORITY_STYLE[detail.priority].bg}
              fg={PRIORITY_STYLE[detail.priority].fg}
              size="md"
            />
          </DetailField>
          <DetailField label="Business Name" value={detail.businessName} />
          <DetailField label="Status">
            <StatusPill label={detail.status} bg={status.bg} fg={status.fg} size="md" />
          </DetailField>
          <DetailField label="Created By" value={detail.createdBy} />
          <DetailField label="Completed By" value={detail.completedBy} />
          <DetailField
            label="Completed On"
            value={
              detail.completedOn ? formatDateTime(detail.completedOn) : null
            }
          />
          <DetailField
            label="Request Date & Time"
            value={formatDateTime(detail.requestedAt)}
          />
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
            ) : (
              <Text style={[styles.fieldValue, styles.fieldValueEmpty]}>
                N/A
              </Text>
            )}
          </DetailField>
        </DetailSection>

        <DetailSection title="Location Details">
          <DetailField label="Address" value={detail.address} full />
          <DetailField label="Zone" value={detail.zone} />
          <DetailField
            label="Describe Location"
            value={detail.describeLocation}
          />
        </DetailSection>

        <DetailSection title="Connected Elements">
          <DetailField label="Fixture" value={detail.fixture} />
          <DetailField
            label="Incident"
            value={detail.incidents.join(', ') || null}
          />
          <DetailField
            label="Person of Interest"
            value={detail.pois.join(', ') || null}
          />
          <DetailField
            label="Equipment"
            value={detail.equipment.join(', ') || null}
          />
        </DetailSection>

        <DetailSection title="Comment" grid={false}>
          <CommentList
            comments={detail.comments}
            onEdit={comment => {
              setEditingComment(comment);
              setCommentSheetOpen(true);
            }}
            onDelete={setDeletingComment}
          />
        </DetailSection>
      </ScrollView>

      <CommentSheet
        visible={commentSheetOpen}
        comment={editingComment}
        placeholder="Write a comment about this maintenance…"
        onSubmit={async (text, images) => {
          if (editingComment) {
            await updateComment(detail.id, editingComment.id, text, images);
          } else {
            await addComment(detail.id, text, images);
          }
        }}
        onClose={() => setCommentSheetOpen(false)}
      />

      <ConfirmDialog
        visible={deletingComment !== null}
        title="Delete this comment?"
        message="The comment and any images attached to it will be removed."
        confirmLabel="Delete"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={async () => {
          const target = deletingComment;
          setDeletingComment(null);
          if (!target) {
            return;
          }
          try {
            await deleteComment(detail.id, target.id);
          } catch {
            setToast({
              title: "Couldn't delete comment",
              message: 'The comment is still there. Check your connection and try again.',
              variant: 'danger',
            });
          }
        }}
        onCancel={() => setDeletingComment(null)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this maintenance?"
        message={`Maintenance ${detail.reference} will be permanently deleted. This action cannot be undone.`}
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

      <AssigneeSheet
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={(item, name) => {
          // REFRESH_ASSIGN deliberately omits the detail query — it also fires
          // from Work and Home, where that query isn't mounted. Refetching here
          // keeps the omission without leaving this screen stale.
          refetch();
          setToast({
            title: 'Maintenance assigned',
            message: `${item.reference} is now with ${name} — moved out of Unassigned.`,
          });
        }}
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 18,
    paddingBottom: theme.spacing.lg,
  },
  idBig: {
    // Shrink rather than grow: with `flex: 1` a wrapped action row would leave
    // the reference stretched across a line of its own dead space.
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 25,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  idActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  assignButtonText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.primary,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.glass.pillBorder,
    backgroundColor: theme.glass.buttonFill,
    ...theme.shadow.glassPill,
  },
  commentButtonText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  // Still used directly by the Ambassador/Program Name/Document-empty custom
  // `children` nodes below — those aren't plain `value` props, so they can't
  // go through DetailField's own internal text style.
  fieldValue: {
    fontFamily: theme.fonts.black,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
  },
  fieldValueEmpty: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted,
  },
  withAvatar: {flexDirection: 'row', alignItems: 'center', gap: 8},
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.black,
    fontSize: 10,
    color: theme.colors.white,
  },
  departmentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
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

export default ViewMaintenanceScreen;
