import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Card} from '../../../components/ui';
import {ChevronDownIcon, MoreVerticalIcon} from '../../../components/icons';
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
  const menuOptions =
    item.status === 'Open'
      ? STATUS_MENU_OPTIONS
      : STATUS_MENU_OPTIONS.filter(option => option.status === 'Completed');

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.id}>{item.id}</Text>
            <Text style={styles.category} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.pill, {backgroundColor: status.bg}]}
              activeOpacity={actionable ? 0.8 : 1}
              disabled={!actionable}
              onPress={onToggleMenu}>
              <Text style={[styles.pillText, {color: status.fg}]}>
                {item.status}
              </Text>
              {actionable ? (
                <ChevronDownIcon size={12} color={status.fg} />
              ) : null}
            </TouchableOpacity>

            {actionable ? (
              <TouchableOpacity
                style={styles.kebab}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                onPress={onToggleMenu}>
                <MoreVerticalIcon size={17} />
              </TouchableOpacity>
            ) : null}

            {menuOpen ? (
              <View style={styles.menu}>
                {menuOptions.map(option => (
                  <TouchableOpacity
                    key={option.status}
                    style={styles.menuRow}
                    activeOpacity={0.7}
                    onPress={() => onSelectStatus(item, option.status)}>
                    <View style={[styles.menuDot, {backgroundColor: option.dot}]} />
                    <Text style={styles.menuLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.dateLine}>
          {item.bucket === 'assigned' ? 'Assigned ' : ''}
          {formatDate(item.date)}
        </Text>

        <View style={styles.divider} />

        {item.bucket === 'assigned' ? (
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.label}>{TYPE_LABEL[item.category]}</Text>
              <Text style={styles.value} numberOfLines={1}>
                {item.type}
              </Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Priority</Text>
              <View
                style={[
                  styles.priorityPill,
                  {backgroundColor: PRIORITY_STYLE[item.priority].bg},
                ]}>
                <Text
                  style={[
                    styles.priorityPillText,
                    {color: PRIORITY_STYLE[item.priority].fg},
                  ]}>
                  {item.priority}
                </Text>
              </View>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.label}>Assigned By</Text>
              <View style={styles.assignee}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.assigneeInitials}</Text>
                </View>
                <Text style={styles.value} numberOfLines={1}>
                  {item.assignee}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.label}>{TYPE_LABEL[item.category]}</Text>
              <Text style={styles.value} numberOfLines={1}>
                {item.type}
              </Text>
            </View>
            {completedFields(item).map(field => (
              <View key={field.label} style={styles.gridCell}>
                <Text style={styles.label}>{field.label}</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.addressBlock}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{item.address}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {gap: theme.spacing.sm},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  id: {fontFamily: theme.fonts.black, fontSize: 15, color: '#181B1F'},
  category: {
    flexShrink: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {fontFamily: theme.fonts.black, fontSize: 11},
  // Anchors the popover — it positions absolute against this, not the card.
  headerRight: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  kebab: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  menuDot: {width: 9, height: 9, borderRadius: 5},
  menuLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
  dateLine: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  divider: {height: 1, backgroundColor: '#EEF0F2'},
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  gridCell: {flex: 1, gap: 4},
  priorityPill: {
    alignSelf: 'flex-start',
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityPillText: {fontFamily: theme.fonts.bold, fontSize: 12},
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
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
  addressBlock: {gap: 4, marginTop: theme.spacing.xs},
});

export default WorkCard;
