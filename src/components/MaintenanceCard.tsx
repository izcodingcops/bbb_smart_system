import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {theme} from '../theme';
import {MaintenanceRecord} from '../types/maintenance';

interface Props {
  record: MaintenanceRecord;
  onPress: () => void;
  disableDetails?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: theme.colors.error,
  Medium: '#F59E0B',
  Low: theme.colors.success,
};

const MaintenanceCard: React.FC<Props> = ({record, onPress, disableDetails = false}) => (
  <View style={[styles.card, theme.shadow.card]}>
    <View style={styles.headerRow}>
      <Text style={styles.ticket}>{record.ticket_number}</Text>
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{record.status}</Text>
      </View>
    </View>
    <Text style={styles.timestamp}>{new Date(record.created_at).toLocaleString()}</Text>
    <View style={styles.metaRow}>
      <Text style={styles.metaText}>Type: {String(record.maintenance_type_id)}</Text>
      <Text
        style={[
          styles.priorityText,
          {color: PRIORITY_COLORS[record.priority] ?? theme.colors.textSecondary},
        ]}>
        {record.priority}
      </Text>
    </View>
    <Text style={styles.address} numberOfLines={2}>
      {record.address}
    </Text>
    {!disableDetails && (
      <TouchableOpacity
        testID="maintenance-card-view-details"
        style={styles.detailsBtn}
        onPress={onPress}
        activeOpacity={0.7}>
        <Text style={styles.detailsText}>View Details →</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  headerRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  ticket: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.base, color: theme.colors.text},
  statusPill: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  statusText: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.xs, color: theme.colors.primary},
  timestamp: {fontFamily: theme.fonts.regular, fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 4},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm},
  metaText: {fontFamily: theme.fonts.medium, fontSize: theme.fontSize.xs + 2, color: theme.colors.textSecondary},
  priorityText: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.xs + 2},
  address: {fontFamily: theme.fonts.regular, fontSize: theme.fontSize.xs + 2, color: theme.colors.textSecondary, marginTop: 4},
  detailsBtn: {marginTop: theme.spacing.md},
  detailsText: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.xs + 2, color: theme.colors.primary},
});

export default MaintenanceCard;
