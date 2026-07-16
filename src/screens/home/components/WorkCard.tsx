import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Card} from '../../../components/ui';
import {WorkItem, WorkPriority, WorkStatus} from '../../../types/work';
import {theme} from '../../../theme';

const STATUS_STYLE: Record<WorkStatus, {bg: string; fg: string}> = {
  Open: {bg: '#EEF1F4', fg: '#5B5F66'},
  'In-progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

const PRIORITY_COLOR: Record<WorkPriority, string> = {
  High: '#DC2626',
  Medium: '#D97706',
  Low: '#16A34A',
};

interface Props {
  item: WorkItem;
}

const WorkCard: React.FC<Props> = ({item}) => {
  const status = STATUS_STYLE[item.status];
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.idRow}>
          <Text style={styles.id}>{item.id}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <View style={[styles.badge, {backgroundColor: status.bg}]}>
          <Text style={[styles.badgeText, {color: status.fg}]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>{item.date}</Text>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Type</Text>
          <Text style={styles.metaValue}>{item.type}</Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Priority</Text>
          <Text style={[styles.metaValue, {color: PRIORITY_COLOR[item.priority]}]}>
            {item.priority}
          </Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Assigned To</Text>
          <View style={styles.assigneeRow}>
            <View style={styles.assigneeAvatar}>
              <Text style={styles.assigneeInitials}>{item.assigneeInitials}</Text>
            </View>
            <Text style={styles.assigneeName} numberOfLines={1}>
              {item.assignee}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.metaLabel}>Address</Text>
      <Text style={styles.address}>{item.address}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idRow: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  id: {fontFamily: theme.fonts.black, fontSize: 15.5, color: '#181B1F'},
  category: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  badge: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5},
  badgeText: {fontFamily: theme.fonts.black, fontSize: 12},
  date: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  metaRow: {flexDirection: 'row', marginBottom: theme.spacing.md},
  metaCol: {flex: 1},
  metaLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 11.5,
    color: theme.colors.textMuted,
    marginBottom: 3,
  },
  metaValue: {fontFamily: theme.fonts.black, fontSize: 13.5, color: '#20242A'},
  assigneeRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  assigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitials: {
    fontFamily: theme.fonts.black,
    fontSize: 9,
    color: theme.colors.white,
  },
  assigneeName: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: '#20242A',
    flex: 1,
  },
  address: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: '#20242A',
    marginTop: 2,
  },
});

export default React.memo(WorkCard);
