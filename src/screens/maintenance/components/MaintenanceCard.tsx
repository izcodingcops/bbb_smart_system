import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Card} from '../../../components/ui';
import {
  ChevronDownIcon,
  CloudOffIcon,
  MoreVerticalIcon,
} from '../../../components/icons';
import {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../types/maintenance';
import {theme} from '../../../theme';

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

const STATUS_MENU_OPTIONS: {
  status: MaintenanceStatus;
  label: string;
  dot: string;
}[] = [
  {status: 'In-progress', label: 'Move to In-progress', dot: '#AD8B00'},
  {status: 'Completed', label: 'Mark Completed', dot: '#389E0D'},
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * 'Jul 6, 2026 · 08:40 AM'. The hour is padded by hand because en-US drops a
 * leading zero from 12-hour times even with `hour: '2-digit'`, which loses the
 * column alignment the design relies on.
 */
function formatRequestedAt(iso: string): string {
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

/**
 * Completed is terminal, and an unassigned request is the supervisor's to
 * route — neither offers a status change.
 */
export function canChangeStatus(request: MaintenanceRequest): boolean {
  return request.status !== 'Completed' && !!request.assignee;
}

interface Props {
  request: MaintenanceRequest;
  onPress: (request: MaintenanceRequest) => void;
  /** True while this card's own status menu is the open one. */
  menuOpen: boolean;
  /** Opens this card's menu, or closes it if already open. */
  onToggleMenu: () => void;
  onSelectStatus: (request: MaintenanceRequest, status: MaintenanceStatus) => void;
}

const MaintenanceCard: React.FC<Props> = ({
  request,
  onPress,
  menuOpen,
  onToggleMenu,
  onSelectStatus,
}) => {
  const status = STATUS_STYLE[request.status];
  const actionable = canChangeStatus(request);
  const menuOptions =
    request.status === 'Open'
      ? STATUS_MENU_OPTIONS
      : STATUS_MENU_OPTIONS.filter(option => option.status === 'Completed');

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(request)}>
      <Card style={styles.card}>
      <View style={styles.headerRow}>
        {/* Shrinks so a long type truncates rather than shoving the pill off. */}
        <View style={styles.headerLeft}>
          <Text style={styles.id}>{request.id}</Text>
          <Text style={styles.type} numberOfLines={1}>
            {request.type}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.pill, {backgroundColor: status.bg}]}
            activeOpacity={actionable ? 0.8 : 1}
            disabled={!actionable}
            onPress={onToggleMenu}>
            <Text style={[styles.pillText, {color: status.fg}]}>
              {request.status}
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
                  onPress={() => onSelectStatus(request, option.status)}>
                  <View style={[styles.menuDot, {backgroundColor: option.dot}]} />
                  <Text style={styles.menuLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.dateLine}>
        {formatRequestedAt(request.requestedAt)}
        {request.routedToSupervisor ? ' · Routed to supervisor' : ''}
      </Text>

      {request.queuedOffline ? (
        <View style={styles.queuedRow}>
          <CloudOffIcon size={13} color="#C26401" />
          <Text style={styles.queued}>Queued · offline</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.label}>Business Name</Text>
          <Text style={styles.value} numberOfLines={1}>
            {request.businessName}
          </Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.label}>Priority</Text>
          <View
            style={[
              styles.priorityPill,
              {backgroundColor: PRIORITY_STYLE[request.priority].bg},
            ]}>
            <Text
              style={[
                styles.priorityPillText,
                {color: PRIORITY_STYLE[request.priority].fg},
              ]}>
              {request.priority}
            </Text>
          </View>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.label}>Assigned To</Text>
          <View style={styles.assignee}>
            <View
              style={[styles.avatar, !request.assignee && styles.avatarPending]}>
              {request.assignee ? (
                <Text style={styles.avatarText}>
                  {request.assignee.initials}
                </Text>
              ) : null}
            </View>
            <Text style={styles.value} numberOfLines={1}>
              {request.assignee ? request.assignee.name : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.addressBlock}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{request.address}</Text>
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
  type: {
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
  // Anchored under the pill/kebab row, matching the design's status dropdown.
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
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  // Card's own `gap` already spaces this from its neighbours.
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
  avatarPending: {backgroundColor: '#D7DBE0'},
  avatarText: {
    fontFamily: theme.fonts.black,
    fontSize: 9,
    color: theme.colors.white,
  },
  addressBlock: {gap: 4, marginTop: theme.spacing.xs},
});

export default MaintenanceCard;
