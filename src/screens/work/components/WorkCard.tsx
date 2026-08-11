import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  formatCardDate,
  PriorityPill,
  RecordCard,
  StatusPill,
} from '../../../components/ui';
import {CloudOffIcon, UserPlusIcon} from '../../../components/icons';
import {WorkCategory, WorkItem, WorkPriority, WorkStatus} from '../../../types/work';
import {theme} from '../../../theme';

const STATUS_STYLE: Record<WorkStatus, {bg: string; fg: string}> = {
  Open: {bg: '#F1F3F5', fg: '#475467'},
  'In-progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

const PRIORITY_STYLE: Record<WorkPriority, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

const STATUS_MENU_OPTIONS: {status: WorkStatus; label: string; dot: string}[] = [
  {status: 'In-progress', label: 'Move to In-progress', dot: '#AD8B00'},
  {status: 'Completed', label: 'Mark Completed', dot: '#389E0D'},
];

/** The card's "Type" row label reads differently per category, design-wise. */
const TYPE_LABEL: Record<WorkCategory, string> = {
  Maintenance: 'Type',
  Incident: 'Incident Type',
  Fixture: 'Fixture Type',
  POI: 'Person Type',
  Activity: 'Sub Type',
};

/** The completed card's second detail row (beyond Type) varies by category. */
function completedFields(item: WorkItem): {label: string; value: string}[] {
  switch (item.category) {
    case 'Maintenance':
      return [
        {label: 'Priority', value: item.priority},
        {label: 'Zone', value: item.zone},
      ];
    case 'Incident':
      return [
        {label: 'Priority', value: item.priority},
        {label: 'Outcome', value: item.outcome ?? '—'},
      ];
    case 'Fixture':
      return [
        {label: 'Status', value: item.outcome ?? '—'},
        {label: 'Zone', value: item.zone},
      ];
    case 'POI':
      return [
        {label: 'Interaction', value: item.interaction ?? '—'},
        {label: 'Disposition', value: item.disposition ?? '—'},
      ];
    case 'Activity':
      return [
        {label: 'Business', value: item.businessName ?? '—'},
        {label: 'Quantity', value: item.quantity ?? '—'},
      ];
  }
}

/**
 * Completed is terminal — only an open or in-progress item can change status.
 * An Unassigned item is also excluded: it has no assignee yet, so it's the
 * supervisor's to route (via "Choose Assignee"), not something whose status
 * changes from the card — same rule as MaintenanceCard's canChangeStatus.
 */
export function canChangeStatus(item: WorkItem): boolean {
  return item.status !== 'Completed' && item.bucket !== 'unassigned';
}

interface Props {
  item: WorkItem;
  onPress: (item: WorkItem) => void;
  /** True while this card's own status menu is the open one. */
  menuOpen: boolean;
  /** Opens this card's menu, or closes it if already open. */
  onToggleMenu: (id: string) => void;
  onSelectStatus: (item: WorkItem, status: WorkStatus) => void;
  /** Tighter padding — Home's Recent Work and the Work tab pass this. */
  compact?: boolean;
  /** Unassigned-bucket cards render a "Choose Assignee" button instead of a name. */
  onOpenAssign?: (item: WorkItem) => void;
}

const WorkCard: React.FC<Props> = ({
  item,
  onPress,
  menuOpen,
  onToggleMenu,
  onSelectStatus,
  compact,
  onOpenAssign,
}) => {
  const status = STATUS_STYLE[item.status];
  const actionable = canChangeStatus(item);
  const menuOptions = (
    item.status === 'Open'
      ? STATUS_MENU_OPTIONS
      : STATUS_MENU_OPTIONS.filter(option => option.status === 'Completed')
  ).map(option => ({value: option.status, label: option.label, dot: option.dot}));

  const fields =
    item.bucket === 'assigned'
      ? [
          {label: TYPE_LABEL[item.category], value: item.type},
          {
            label: 'Priority',
            node: (
              <PriorityPill
                label={item.priority}
                bg={PRIORITY_STYLE[item.priority].bg}
                fg={PRIORITY_STYLE[item.priority].fg}
              />
            ),
          },
          {
            label: 'Assigned By',
            node: (
              <View style={styles.assignee}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.assigneeInitials}</Text>
                </View>
                <Text style={styles.value} numberOfLines={1}>
                  {item.assignee}
                </Text>
              </View>
            ),
          },
        ]
      : item.bucket === 'unassigned'
      ? [
          {label: TYPE_LABEL[item.category], value: item.type},
          {
            label: 'Priority',
            node: (
              <PriorityPill
                label={item.priority}
                bg={PRIORITY_STYLE[item.priority].bg}
                fg={PRIORITY_STYLE[item.priority].fg}
              />
            ),
          },
          {
            label: 'Assigned To',
            node: (
              <TouchableOpacity
                style={styles.chooseAssignee}
                activeOpacity={0.85}
                onPress={() => onOpenAssign?.(item)}>
                <View style={styles.chooseAssigneeAvatar}>
                  <UserPlusIcon size={13} color={theme.colors.primary} />
                </View>
                <Text style={styles.chooseAssigneeText} numberOfLines={1}>
                  Choose Assignee
                </Text>
              </TouchableOpacity>
            ),
          },
        ]
      : [
          {label: TYPE_LABEL[item.category], value: item.type},
          ...completedFields(item).map(field => ({
            label: field.label,
            value: field.value,
          })),
        ];

  return (
    <RecordCard
      compact={compact}
      onPress={() => onPress(item)}
      idLabel={item.reference}
      typeLabel={item.category}
      statusPill={
        <StatusPill
          label={item.status}
          bg={status.bg}
          fg={status.fg}
          onPress={actionable ? () => onToggleMenu(item.id) : undefined}
          trailingChevron={actionable}
        />
      }
      kebab={
        // No separate "⋮" trigger — tapping the status pill above is the only
        // way to open this, matching the mockup's own status-pill-only
        // pattern (Maintenance's card keeps its kebab; this one doesn't).
        actionable && menuOpen ? (
          <View style={styles.statusMenu}>
            {menuOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.statusMenuRow}
                activeOpacity={0.7}
                onPress={() => onSelectStatus(item, option.value as WorkStatus)}>
                <View style={[styles.statusMenuDot, {backgroundColor: option.dot}]} />
                <Text style={styles.statusMenuLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : undefined
      }
      dateLine={
        item.bucket === 'unassigned' && item.createdBy
          ? `${formatCardDate(item.date)} · Sent by ${item.createdBy}`
          : `${item.bucket === 'assigned' ? 'Assigned ' : ''}${formatCardDate(item.date)}`
      }
      badge={
        item.queuedOffline ? (
          <View style={styles.queuedRow}>
            <CloudOffIcon size={13} color="#C26401" />
            <Text style={styles.queued}>Queued · offline</Text>
          </View>
        ) : undefined
      }
      fields={fields}
      addressLabel="Address"
      addressValue={item.address}
    />
  );
};

const styles = StyleSheet.create({
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  // Matches RecordCard's own internal `value` style for a custom field node.
  value: {fontFamily: theme.fonts.black, fontSize: 13, color: '#181B1F'},
  assignee: {flexDirection: 'row', alignItems: 'center', gap: 6},
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.black,
    fontSize: 9,
    color: theme.colors.white,
  },
  chooseAssignee: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    height: 28,
    paddingLeft: 3,
    paddingRight: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.primaryLight,
  },
  chooseAssigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#99D3FF',
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseAssigneeText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: theme.colors.primary,
  },
  // Matches KebabMenu's own popover styling — reimplemented locally here
  // since this card doesn't render KebabMenu's "⋮" trigger.
  statusMenu: {
    position: 'absolute',
    top: 34,
    right: 0,
    zIndex: 20,
    elevation: 20,
    minWidth: 184,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    padding: 6,
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  statusMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statusMenuDot: {width: 9, height: 9, borderRadius: 5},
  statusMenuLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
});

export default React.memo(WorkCard);
