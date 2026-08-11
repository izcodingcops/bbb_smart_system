import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
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
  formatDateTimeOrNull,
} from '../../components/ui';
import {AlertTriangleIcon, MessageSquareIcon} from '../../components/icons';
import {
  useAddIncidentCommentMutation,
  useDeleteIncidentCommentMutation,
  useDeleteIncidentMutation,
  useGetIncidentQuery,
  useIncidentFormOptionsQuery,
  useUpdateIncidentCommentMutation,
  useUpdateIncidentMutation,
} from '../../graphql/features/incident/hooks';
import {IncidentComment, IncidentPriority, IncidentResponderInfo, IncidentStatus} from '../../types/incident';
import IncidentForm, {buildInitialValues} from './components/IncidentForm';
import {theme} from '../../theme';

const STATUS_STYLE: Record<IncidentStatus, {bg: string; fg: string}> = {
  Open: {bg: '#F1F3F5', fg: '#475467'},
  'In-progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

const SUPERVISOR_STATUS_STYLE: Record<string, {bg: string; fg: string}> = {
  'In Progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

const PRIORITY_STYLE: Record<IncidentPriority, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

/** 'John Carter' → 'JC', for the small avatar next to the Ambassador field. */
function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(word => word[0]).join('').slice(0, 2).toUpperCase();
}

/** Static chip row; N/A when the list is empty. */
const Chips: React.FC<{values: string[]}> = ({values}) =>
  values.length > 0 ? (
    <View style={styles.chips}>
      {values.map(value => (
        <View key={value} style={styles.chip}>
          <Text style={styles.chipText}>{value}</Text>
        </View>
      ))}
    </View>
  ) : (
    <Text style={styles.na}>N/A</Text>
  );

/** Police and Fire share this three-field shape; EMS adds a responder field. */
const responderFields = (info: IncidentResponderInfo, nameLabel: string) => (
  <>
    <DetailField label={nameLabel} value={info.name} />
    <DetailField label="Time Called" value={formatDateTimeOrNull(info.timeCalled)} />
    <DetailField label="Arrived Time" value={formatDateTimeOrNull(info.timeArrived)} full />
  </>
);

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the list can pop back and toast. */
  onDeleted: (reference: string) => void;
}

const ViewIncidentScreen: React.FC<Props> = ({id, onClose, onDeleted}) => {
  // Every hook runs before the early returns below — the loading, editing and
  // detail branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetIncidentQuery(id);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<IncidentComment | null>(null);
  const [deletingComment, setDeletingComment] = useState<IncidentComment | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{title: string; message: string; variant?: 'success' | 'danger'} | null>(null);
  const {mutate: addComment} = useAddIncidentCommentMutation();
  const {mutate: updateComment} = useUpdateIncidentCommentMutation();
  const {mutate: deleteComment} = useDeleteIncidentCommentMutation();
  const {data: options} = useIncidentFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} = useUpdateIncidentMutation();
  const {mutate: remove} = useDeleteIncidentMutation();

  if (isLoading) {
    return (
      <DetailScreenSkeleton
        title="Incident"
        onBack={onClose}
        showCommentButton
        sections={[
          [...Array(8).fill('half'), 'full'],
          ['half', 'half', 'half', 'half', 'full'],
          Array(6).fill('half'),
          ['half', 'half', 'full'],
          ['half', 'half', 'full'],
          Array(4).fill('half'),
          ['full'],
          Array(6).fill('half'),
          Array(6).fill('half'),
          Array(3).fill('full'),
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <ScreenBackground style={styles.root}>
        <DetailTopBar title="Incident" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<AlertTriangleIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this incident"
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
        <IncidentForm
          mode="edit"
          reference={detail.reference}
          options={options}
          initialValues={buildInitialValues(options, detail)}
          submitLabel="Update"
          isSubmitting={isUpdating}
          onSubmit={async values => {
            await update(detail.id, values);
            setEditing(false);
            setToast({title: 'Incident updated', message: `${detail.reference} was saved successfully.`});
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  const status = STATUS_STYLE[detail.status];
  const supervisorStyle = SUPERVISOR_STATUS_STYLE[detail.supervisorStatus] ?? SUPERVISOR_STATUS_STYLE['In Progress'];

  return (
    <ScreenBackground style={styles.root}>
      <DetailTopBar
        title="Incident"
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
            {detail.ambassador ? (
              <View style={styles.withAvatar}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initialsOf(detail.ambassador)}</Text>
                </View>
                <Text style={styles.fieldValue}>{detail.ambassador}</Text>
              </View>
            ) : (
              <Text style={[styles.fieldValue, styles.fieldValueEmpty]}>N/A</Text>
            )}
          </DetailField>
          <DetailField label="Type" value={detail.type} />
          <DetailField label="Outcome" value={detail.outcome} />
          <DetailField label="Priority">
            <PriorityPill label={detail.priority} bg={PRIORITY_STYLE[detail.priority].bg} fg={PRIORITY_STYLE[detail.priority].fg} />
          </DetailField>
          <DetailField label="Created By" value={detail.createdBy} />
          <DetailField label="Report Status">
            <StatusPill label={detail.status} bg={status.bg} fg={status.fg} />
          </DetailField>
          <DetailField label="Incident Date & Time" value={formatDateTime(detail.occurredAt)} />
          <DetailField label="Last Modified By" value={detail.lastModifiedBy} />
          <DetailField label="Last Modified Date" value={formatDateTimeOrNull(detail.lastModifiedAt)} full />
        </DetailSection>

        <DetailSection title="Location Details">
          <DetailField label="Address" value={detail.address} />
          <DetailField label="Describe Location" value={detail.describeLocation} />
          <DetailField label="Latitude" value={detail.latitude} />
          <DetailField label="Longitude" value={detail.longitude} />
          <DetailField label="Zone" value={detail.zone} full />
        </DetailSection>

        <DetailSection title="Other Details">
          <DetailField label="Business Name" value={detail.businessName} />
          <DetailField label="Fixture" value={detail.fixture} />
          <DetailField label="Description" value={detail.description} />
          <DetailField label="Document" value={detail.documents.length > 0 ? `${detail.documents.length} file(s)` : null} />
          <DetailField label="Supervisor Status">
            <StatusPill label={detail.supervisorStatus} bg={supervisorStyle.bg} fg={supervisorStyle.fg} />
          </DetailField>
          <DetailField label="Report Status">
            <StatusPill label={detail.status} bg={status.bg} fg={status.fg} />
          </DetailField>
        </DetailSection>

        <DetailSection title="Is Police Involved?">{responderFields(detail.police, 'Officer Name')}</DetailSection>

        <DetailSection title="Is Fire Fighter Involved?">{responderFields(detail.fire, 'Fire Engine Name')}</DetailSection>

        <DetailSection title="Is EMS Involved?">
          <DetailField label="EMS Company Name" value={detail.ems.name} />
          <DetailField label="Responder Name" value={detail.ems.responder} />
          <DetailField label="Time Called" value={formatDateTimeOrNull(detail.ems.timeCalled)} />
          <DetailField label="Arrived Time" value={formatDateTimeOrNull(detail.ems.timeArrived)} />
        </DetailSection>

        <DetailSection title="Is Client Involved?">
          <DetailField label="Client Name" value={detail.clientName} full />
        </DetailSection>

        <DetailSection title="Parties Detail">
          {detail.parties.length > 0 ? (
            detail.parties.map((party, index) => (
              <React.Fragment key={`${party.name ?? 'party'}-${index}`}>
                <DetailField label="Name" value={party.name} />
                <DetailField label="Type" value={party.type} />
                <DetailField label="Business / ORG" value={party.organization} />
                <DetailField label="Street Address" value={party.streetAddress} />
                <DetailField label="Phone No" value={party.phone} />
                <DetailField label="Email" value={party.email} />
              </React.Fragment>
            ))
          ) : (
            <DetailField label="Name" full />
          )}
        </DetailSection>

        <DetailSection title="Vehicle Details">
          {detail.vehicles.length > 0 ? (
            detail.vehicles.map((vehicle, index) => (
              <React.Fragment key={`${vehicle.licenseNumber ?? 'vehicle'}-${index}`}>
                <DetailField label="Year" value={vehicle.year} />
                <DetailField label="Make" value={vehicle.make} />
                <DetailField label="Model" value={vehicle.model} />
                <DetailField label="Color" value={vehicle.color} />
                <DetailField label="License No" value={vehicle.licenseNumber} full />
              </React.Fragment>
            ))
          ) : (
            <DetailField label="Year" full />
          )}
        </DetailSection>

        <DetailSection title="Connected Elements">
          <DetailField label="Maintenance" full>
            <Chips values={detail.connectedMaintenance} />
          </DetailField>
          <DetailField label="Person of Interest" full>
            <Chips values={detail.connectedPois} />
          </DetailField>
          <DetailField label="Equipment" full>
            <Chips values={detail.connectedEquipment} />
          </DetailField>
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
        placeholder="Write a comment about this incident…"
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
        title="Delete this incident?"
        message={`Incident ${detail.reference} will be permanently deleted. This action cannot be undone.`}
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
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
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
  idBig: {flex: 1, fontFamily: theme.fonts.black, fontSize: 25, letterSpacing: -0.5, color: theme.colors.text},
  commentButton: {
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
  commentButtonText: {fontFamily: theme.fonts.black, fontSize: 14, color: theme.colors.text},
  fieldValue: {fontFamily: theme.fonts.black, fontSize: 15, lineHeight: 20, color: theme.colors.text},
  fieldValueEmpty: {fontFamily: theme.fonts.bold, color: theme.colors.textMuted},
  withAvatar: {flexDirection: 'row', alignItems: 'center', gap: 8},
  avatar: {width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontFamily: theme.fonts.black, fontSize: 10, color: theme.colors.white},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#99D3FF', backgroundColor: theme.colors.primaryLight},
  chipText: {fontFamily: theme.fonts.bold, fontSize: 13, color: theme.colors.primary},
  na: {fontFamily: theme.fonts.bold, fontSize: 15, lineHeight: 20, color: theme.colors.textMuted},
});

export default ViewIncidentScreen;
