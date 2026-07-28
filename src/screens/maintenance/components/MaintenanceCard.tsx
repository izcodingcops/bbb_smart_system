import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Card} from '../../../components/ui';
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

const PRIORITY_COLOR: Record<MaintenancePriority, string> = {
  High: '#D92D20',
  Medium: '#B45309',
  Low: '#16A34A',
};

/** 'Jul 6, 2026 · 08:40 AM' */
function formatRequestedAt(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${day} · ${time}`;
}

interface Props {
  request: MaintenanceRequest;
}

const MaintenanceCard: React.FC<Props> = ({request}) => {
  const status = STATUS_STYLE[request.status];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        {/* Shrinks so a long type truncates rather than shoving the pill off. */}
        <View style={styles.headerLeft}>
          <Text style={styles.id}>{request.id}</Text>
          <Text style={styles.type} numberOfLines={1}>
            {request.type}
          </Text>
        </View>
        <View style={[styles.pill, {backgroundColor: status.bg}]}>
          <Text style={[styles.pillText, {color: status.fg}]}>
            {request.status}
          </Text>
        </View>
      </View>

      <Text style={styles.dateLine}>
        {formatRequestedAt(request.requestedAt)}
        {request.routedToSupervisor ? ' · Routed to supervisor' : ''}
      </Text>

      {request.queuedOffline ? (
        <Text style={styles.queued}>Queued · offline</Text>
      ) : null}

      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.label}>Business Name</Text>
          <Text style={styles.value} numberOfLines={1}>
            {request.businessName}
          </Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.label}>Priority</Text>
          <Text
            style={[styles.value, {color: PRIORITY_COLOR[request.priority]}]}>
            {request.priority}
          </Text>
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {fontFamily: theme.fonts.black, fontSize: 11},
  dateLine: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#B45309'},
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  gridCell: {flex: 1, gap: 4},
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
