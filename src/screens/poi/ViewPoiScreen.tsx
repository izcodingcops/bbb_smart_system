import React, {useRef, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
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
import {
  MessageSquareIcon,
  PlusIcon,
  UserIcon,
  UserPlusIcon,
} from '../../components/icons';
import {
  useDeletePoiMutation,
  useGetPoiQuery,
  usePoiFormOptionsQuery,
  useUpdatePoiMutation,
} from '../../graphql/features/poi/hooks';
import {PoiDetail} from '../../types/poi';
import PoiForm, {buildInitialValues} from './components/PoiForm';
import PoiDetailTabs, {PoiDetailTab} from './components/PoiDetailTabs';
import {
  PoiInteractionTimeline,
  PoiUpdateTimeline,
} from './components/PoiTimeline';
import {DISPOSITION_STYLE} from './filtering';
import {theme} from '../../theme';

const TABS: PoiDetailTab[] = [
  {key: 'poi', label: 'POI Details'},
  {key: 'interactions', label: 'Interactions'},
  {key: 'updates', label: 'Updates'},
];

/** The design shows every chip; this only hides the tail of a long list. */
const CHIP_PREVIEW = 4;

const Chips: React.FC<{values: string[]}> = ({values}) => {
  const [expanded, setExpanded] = useState(false);
  if (values.length === 0) {
    return null;
  }
  const shown = expanded ? values : values.slice(0, CHIP_PREVIEW);
  return (
    <View>
      <View style={styles.chips}>
        {shown.map(value => (
          <View key={value} style={styles.chip}>
            <Text style={styles.chipText}>{value}</Text>
          </View>
        ))}
      </View>
      {values.length > CHIP_PREVIEW ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExpanded(current => !current)}>
          <Text style={styles.seeMore}>
            {expanded ? 'See Less' : 'See More'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const SectionHeaderAction: React.FC<{label: string; onPress: () => void}> = ({
  label,
  onPress,
}) => (
  <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={onPress}>
    <PlusIcon size={14} color={theme.colors.primary} />
    <Text style={styles.addButtonText}>{label}</Text>
  </TouchableOpacity>
);

interface Props {
  id: string;
  onClose: () => void;
  /** Fires after the record is gone, so the list can pop back and toast. */
  onDeleted: (reference: string) => void;
  onAddInteraction: (poi: PoiDetail) => void;
  onAddUpdate: (poi: PoiDetail) => void;
}

const ViewPoiScreen: React.FC<Props> = ({
  id,
  onClose,
  onDeleted,
  onAddInteraction,
  onAddUpdate,
}) => {
  // Every hook runs before the early returns below — the loading, editing and
  // detail branches must not change hook order between renders.
  const {data: detail, isLoading, isError, refetch} = useGetPoiQuery(id);
  const [activeTab, setActiveTab] = useState('poi');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'danger';
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const {data: options} = usePoiFormOptionsQuery();
  const {mutate: update, isLoading: isUpdating} = useUpdatePoiMutation();
  const {mutate: remove} = useDeletePoiMutation();

  if (isLoading) {
    // Matches the POI Details tab's own sections: Basic (6 half + 1 full),
    // Demographics (6 half + 3 full), Contacts (1 full), Location (1 full +
    // 2 half), Connected (3 full).
    return (
      <DetailScreenSkeleton
        title="Person"
        onBack={onClose}
        sections={[
          ['half', 'half', 'half', 'half', 'half', 'half', 'full'],
          ['half', 'half', 'half', 'half', 'half', 'half', 'full', 'full', 'full'],
          ['full'],
          ['full', 'half', 'half'],
          ['full', 'full', 'full'],
        ]}
      />
    );
  }

  // The back button renders above this branch on purpose — the tab bar is
  // hidden on this route, so a failed load with no way out would trap the user.
  if (isError || !detail) {
    return (
      <View style={styles.root}>
        <DetailTopBar title="Person" onBack={onClose} />
        <View style={styles.loading}>
          <EmptyState
            icon={<UserPlusIcon size={28} color={theme.colors.primary} />}
            title="Couldn't load this person"
            body="Something went wrong fetching them. Check your connection and try again."
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
        <PoiForm
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
              title: 'Person updated',
              message: `${detail.reference} was saved successfully.`,
            });
          }}
          onClose={() => setEditing(false)}
        />
      </View>
    );
  }

  const disposition = DISPOSITION_STYLE[detail.disposition];

  const selectTab = (key: string) => {
    setActiveTab(key);
    // The design resets the panel to the top on every switch.
    scrollRef.current?.scrollTo({y: 0, animated: false});
  };

  return (
    <View style={styles.root}>
      <DetailTopBar
        title="Person"
        reference={detail.reference}
        onBack={onClose}
        onEdit={() => setEditing(true)}
        onDelete={() => setConfirmDelete(true)}
      />

      <View style={styles.idRow}>
        <View style={styles.idText}>
          <Text style={styles.idBig} numberOfLines={2}>
            {detail.name}
          </Text>
          <Text style={styles.idReference}>{detail.reference}</Text>
        </View>
        {/*
          The design pairs this with a chevron opening a one-item "Add Update"
          menu. Nothing in components/ui is a split button and no affordance is
          lost: Add Update sits in the Update History header below, and on every
          list card's footer.
        */}
        <TouchableOpacity
          style={styles.primaryAction}
          activeOpacity={0.9}
          onPress={() => onAddInteraction(detail)}>
          <MessageSquareIcon size={15} color={theme.colors.white} />
          <Text style={styles.primaryActionText}>Add Interaction</Text>
        </TouchableOpacity>
      </View>

      <PoiDetailTabs tabs={TABS} activeKey={activeTab} onSelect={selectTab} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.body}>
        {activeTab === 'poi' ? (
          <>
            <DetailSection title="Basic Details">
              <DetailField label="Person Type" value={detail.personType} />
              <DetailField label="Disposition">
                <StatusPill
                  label={detail.disposition}
                  bg={disposition.bg}
                  fg={disposition.fg}
                  size="md"
                />
              </DetailField>
              <DetailField
                label="Phone Number or Email"
                value={detail.contact}
              />
              <DetailField label="Created By" value={detail.createdBy.name} />
              <DetailField
                label="First Seen"
                value={formatDateTime(detail.firstSeenAt)}
              />
              <DetailField
                label="Last Modified By"
                value={detail.lastModifiedBy}
              />
              <DetailField
                label="Last Modified Date"
                value={formatDateTime(detail.lastModifiedAt)}
                full
              />
            </DetailSection>

            <DetailSection title="Demographics">
              <DetailField label="Alias" value={detail.alias} />
              <DetailField label="Gender" value={detail.gender} />
              <DetailField label="Age" value={detail.age} />
              <DetailField label="Race" value={detail.race} />
              <DetailField label="Weight (lbs)" value={detail.weight} />
              <DetailField label="Height" value={detail.height} />
              <DetailField
                label="Top 10-20"
                value={detail.top1020 ? 'Yes' : 'No'}
                full
              />
              <DetailField
                label="Physical Description"
                value={detail.physicalDescription}
                full
              />
              <DetailField label="Situation" value={detail.situation} full />
            </DetailSection>

            <DetailSection title="Contacts" grid={false}>
              {detail.contacts.length > 0 ? (
                <View style={styles.contacts}>
                  {detail.contacts.map((contact, index) => (
                    <View key={index} style={styles.contact}>
                      <View style={styles.contactIcon}>
                        <UserIcon size={16} color={theme.colors.primary} />
                      </View>
                      <View style={styles.contactText}>
                        <Text style={styles.contactName}>
                          {contact.relationship
                            ? `${contact.name} · ${contact.relationship}`
                            : contact.name}
                        </Text>
                        <Text style={styles.contactValue}>
                          {[contact.phone, contact.email]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        {contact.notes ? (
                          <Text style={styles.contactNotes}>
                            {contact.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.empty}>No contacts recorded.</Text>
              )}
            </DetailSection>

            <DetailSection title="Location">
              <DetailField label="Address" value={detail.address} full />
              <DetailField
                label="Describe Location"
                value={detail.describeLocation}
              />
              <DetailField label="Zone" value={detail.zone} />
            </DetailSection>

            <DetailSection title="Connected Elements">
              <DetailField label="Incident" full>
                <Chips values={detail.connectedIncidents} />
              </DetailField>
              <DetailField label="Maintenance" full>
                <Chips values={detail.connectedMaintenance} />
              </DetailField>
              <DetailField label="Equipment" full>
                <Chips values={detail.connectedEquipment} />
              </DetailField>
            </DetailSection>

            <DetailSection
              title="Interaction History"
              grid={false}
              action={
                <SectionHeaderAction
                  label="Add"
                  onPress={() => onAddInteraction(detail)}
                />
              }>
              <PoiInteractionTimeline interactions={detail.interactions} />
            </DetailSection>

            <DetailSection
              title="Update History"
              grid={false}
              action={
                <SectionHeaderAction
                  label="Add"
                  onPress={() => onAddUpdate(detail)}
                />
              }>
              <PoiUpdateTimeline updates={detail.updates} />
            </DetailSection>
          </>
        ) : null}

        {activeTab === 'interactions' ? (
          detail.interactions.length > 0 ? (
            detail.interactions.map((interaction, index) => (
              <DetailSection
                key={interaction.id}
                title={
                  detail.interactions.length > 1
                    ? `Interaction ${index + 1} of ${detail.interactions.length}`
                    : 'Interaction Details'
                }>
                <DetailField
                  label="Interaction Type"
                  value={interaction.interactionType}
                />
                <DetailField
                  label="Date & Time"
                  value={formatDateTime(interaction.occurredAt)}
                />
                <DetailField label="Violation" value={interaction.violation} />
                <DetailField label="Zone" value={interaction.zone} />
                <DetailField
                  label="Interaction Note"
                  value={interaction.note}
                  full
                />
              </DetailSection>
            ))
          ) : (
            <DetailSection title="Interactions" grid={false}>
              <Text style={styles.empty}>No interactions logged yet.</Text>
            </DetailSection>
          )
        ) : null}

        {activeTab === 'updates' ? (
          detail.updates.length > 0 ? (
            detail.updates.map((entry, index) => (
              <DetailSection
                key={entry.id}
                title={
                  detail.updates.length > 1
                    ? `Update ${index + 1} of ${detail.updates.length}`
                    : 'Update Details'
                }>
                <DetailField label="Zone" value={entry.zone} />
                <DetailField
                  label="Date & Time"
                  value={formatDateTime(entry.occurredAt)}
                />
                <DetailField
                  label="Description"
                  value={entry.description}
                  full
                />
              </DetailSection>
            ))
          ) : (
            <DetailSection title="Updates" grid={false}>
              <Text style={styles.empty}>No updates logged yet.</Text>
            </DetailSection>
          )
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this person?"
        message={`${detail.name} (${detail.reference}) and their interaction history will be permanently deleted. This action cannot be undone.`}
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
    backgroundColor: theme.colors.white,
  },
  idText: {flex: 1, minWidth: 0},
  idBig: {
    fontFamily: theme.fonts.black,
    fontSize: 23,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  idReference: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    letterSpacing: 0.2,
    color: theme.colors.textMuted,
    marginTop: 5,
  },
  primaryAction: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  primaryActionText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.white,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2},
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: theme.colors.primary,
  },
  seeMore: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
    marginTop: 9,
  },
  contacts: {gap: theme.spacing.sm},
  contact: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8F9FB',
  },
  contactIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  contactText: {flex: 1, minWidth: 0, gap: 3},
  contactName: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  contactValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  contactNotes: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textMuted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  addButtonText: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: theme.colors.primary,
  },
  empty: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textMuted,
  },
});

export default ViewPoiScreen;
