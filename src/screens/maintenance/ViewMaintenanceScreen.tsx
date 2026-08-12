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
import {MessageSquareIcon, ToolsIcon} from '../../components/icons';
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
} from '../../types/maintenance';
import AddFixtureSheet from './components/AddFixtureSheet';
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

/** 'Tom Lee' → 'TL', for the small avatar next to a plain name field. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
  const [addFixtureOpen, setAddFixtureOpen] = useState(false);
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
        />

        <AddFixtureSheet
          visible={addFixtureOpen}
          options={options}
          onCreated={() => refetchOptions()}
          onClose={() => setAddFixtureOpen(false)}
        />
      </View>
    );
  }

  const status = STATUS_STYLE[detail.status];

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
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{detail.reference}</Text>
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

        <DetailSection title="Basic Details">
          <DetailField label="Ambassador">
            <View style={styles.withAvatar}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initialsOf(detail.ambassador)}
                </Text>
              </View>
              <Text style={styles.fieldValue}>{detail.ambassador}</Text>
            </View>
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
  },
  idBig: {
    flex: 1,
    fontFamily: theme.fonts.black,
    fontSize: 25,
    letterSpacing: -0.5,
    color: theme.colors.text,
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
