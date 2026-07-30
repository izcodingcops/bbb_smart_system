import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {KebabMenu, PriorityPill, RecordCard, StatusPill} from '../../../components/ui';
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

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** 'Jul 6, 2026 · 08:40 AM' — hour is padded by hand, en-US drops the leading
 * zero even with `hour: '2-digit'`, which loses the design's column alignment. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${day} · ${pad(hour12)}:${pad(date.getMinutes())} ${suffix}`;
}

/** Completed is terminal — only an open or in-progress item can change status. */
export function canChangeStatus(item: WorkItem): boolean {
  return item.status !== 'Completed';
}

interface Props {
  item: WorkItem;
  onPress: (item: WorkItem) => void;
  /** True while this card's own status menu is the open one. */
  menuOpen: boolean;
  /** Opens this card's menu, or closes it if already open. */
  onToggleMenu: () => void;
  onSelectStatus: (item: WorkItem, status: WorkStatus) => void;
}

const WorkCard: React.FC<Props> = ({
  item,
  onPress,
  menuOpen,
  onToggleMenu,
  onSelectStatus,
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
      : [
          {label: TYPE_LABEL[item.category], value: item.type},
          ...completedFields(item).map(field => ({
            label: field.label,
            value: field.value,
          })),
        ];

  return (
    <RecordCard
      onPress={() => onPress(item)}
      idLabel={item.id}
      typeLabel={item.category}
      statusPill={
        <StatusPill
          label={item.status}
          bg={status.bg}
          fg={status.fg}
          onPress={actionable ? onToggleMenu : undefined}
          trailingChevron={actionable}
        />
      }
      kebab={
        <KebabMenu
          visible={actionable}
          open={menuOpen}
          onToggle={onToggleMenu}
          options={menuOptions}
          onSelect={value => onSelectStatus(item, value as WorkStatus)}
        />
      }
      dateLine={`${item.bucket === 'assigned' ? 'Assigned ' : ''}${formatDate(item.date)}`}
      fields={fields}
      addressLabel="Address"
      addressValue={item.address}
    />
  );
};

const styles = StyleSheet.create({
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
});

export default React.memo(WorkCard);
