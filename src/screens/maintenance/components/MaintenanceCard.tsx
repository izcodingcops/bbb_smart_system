import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  formatCardDate,
  KebabMenu,
  PriorityPill,
  RecordCard,
  StatusPill,
} from '../../../components/ui';
import {CloudOffIcon} from '../../../components/icons';
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
  onToggleMenu: (id: string) => void;
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
  const menuOptions = (
    request.status === 'Open'
      ? STATUS_MENU_OPTIONS
      : STATUS_MENU_OPTIONS.filter(option => option.status === 'Completed')
  ).map(option => ({value: option.status, label: option.label, dot: option.dot}));

  return (
    <RecordCard
      onPress={() => onPress(request)}
      idLabel={request.reference}
      typeLabel={request.type}
      statusPill={
        <StatusPill
          label={request.status}
          bg={status.bg}
          fg={status.fg}
          onPress={actionable ? () => onToggleMenu(request.id) : undefined}
          trailingChevron={actionable}
        />
      }
      kebab={
        <KebabMenu
          visible={actionable}
          open={menuOpen}
          onToggle={() => onToggleMenu(request.id)}
          options={menuOptions}
          onSelect={value => onSelectStatus(request, value as MaintenanceStatus)}
        />
      }
      dateLine={`${formatCardDate(request.requestedAt)}${
        request.routedToSupervisor ? ' · Routed to supervisor' : ''
      }`}
      badge={
        request.queuedOffline ? (
          <View style={styles.queuedRow}>
            <CloudOffIcon size={13} color="#C26401" />
            <Text style={styles.queued}>Queued · offline</Text>
          </View>
        ) : undefined
      }
      fields={[
        {label: 'Business Name', value: request.businessName},
        {
          label: 'Priority',
          node: (
            <PriorityPill
              label={request.priority}
              bg={PRIORITY_STYLE[request.priority].bg}
              fg={PRIORITY_STYLE[request.priority].fg}
            />
          ),
        },
        {
          label: 'Assigned To',
          node: (
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
          ),
        },
      ]}
      addressLabel="Address"
      addressValue={request.address}
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
  avatarPending: {backgroundColor: '#D7DBE0'},
  avatarText: {
    fontFamily: theme.fonts.black,
    fontSize: 9,
    color: theme.colors.white,
  },
});

export default React.memo(MaintenanceCard);
