import React, {useCallback} from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {RecordCard, StatusPill, formatCardDate, formatCardDateOnly} from '../../../components/ui';
import {CalendarIcon, ClockIcon, CloudOffIcon, LogInIcon, LogOutIcon} from '../../../components/icons';
import {Equipment, EquipmentStatus} from '../../../types/equipment';
import {theme} from '../../../theme';

const STATUS_STYLE: Record<EquipmentStatus, {bg: string; fg: string}> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  'Checked-Out': {bg: '#E6F4FF', fg: '#0066B2'},
};

/** 'Ahsann Rizvi' -> 'AR'. Same helper WorkCard's sender avatar uses. */
function initialsOf(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Avatar + name, the shape the mockup's 'Checked Out By' field renders. */
const HolderChip: React.FC<{name: string}> = ({name}) => (
  <View style={styles.holderRow}>
    <View style={styles.holderAvatar}>
      <Text style={styles.holderInitials}>{initialsOf(name)}</Text>
    </View>
    <Text style={styles.holderName} numberOfLines={1}>
      {name}
    </Text>
  </View>
);

interface Props {
  equipment: Equipment;
  /**
   * 'all' is the checkout pool — a status pill, and a Check-Out button only
   * when the record is Active. 'mine' is the custody tab — no pill, always the
   * custody row, always both action buttons.
   */
  variant: 'all' | 'mine';
  onPress: (equipment: Equipment) => void;
  onCheckOut?: (equipment: Equipment) => void;
  onCheckIn?: (equipment: Equipment) => void;
  onAddUpkeep?: (equipment: Equipment) => void;
}

const EquipmentCard: React.FC<Props> = ({
  equipment,
  variant,
  onPress,
  onCheckOut,
  onCheckIn,
  onAddUpkeep,
}) => {
  const handlePress = useCallback(() => onPress(equipment), [onPress, equipment]);
  const handleCheckOut = useCallback(
    () => onCheckOut?.(equipment),
    [onCheckOut, equipment],
  );
  const handleCheckIn = useCallback(
    () => onCheckIn?.(equipment),
    [onCheckIn, equipment],
  );
  const handleAddUpkeep = useCallback(
    () => onAddUpkeep?.(equipment),
    [onAddUpkeep, equipment],
  );

  const checkedOut = equipment.status === 'Checked-Out';
  const showCustodyRow = variant === 'mine' || checkedOut;
  const status = STATUS_STYLE[equipment.status];
  // A queued custody mutation hasn't synced yet, so the local record's
  // status/mine fields are stale — firing another custody action here would
  // queue a second mutation on top of the first with no feedback to the user.
  const actionable = !equipment.queuedOffline;
  const holderName = equipment.mine ? 'Me' : equipment.checkedOutBy ?? '—';

  const dateLine = (
    <View style={styles.dateRow}>
      <CalendarIcon size={14} color={theme.colors.textOnGlassMuted} />
      <Text style={styles.dateText}>
        {variant === 'mine'
          ? formatCardDate(equipment.createdAt)
          : formatCardDateOnly(equipment.createdAt)}
      </Text>
    </View>
  );

  const footer =
    variant === 'mine' ? (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.action, styles.actionGhost, !actionable && styles.actionDisabled]}
          activeOpacity={0.85}
          disabled={!actionable}
          onPress={handleAddUpkeep}>
          <ClockIcon size={15} color={theme.colors.primary} />
          <Text style={styles.actionGhostText}>Add Upkeep</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.action, styles.actionSolid, !actionable && styles.actionDisabled]}
          activeOpacity={0.85}
          disabled={!actionable}
          onPress={handleCheckIn}>
          <LogInIcon size={15} color={theme.colors.white} />
          <Text style={styles.actionSolidText}>Check-In</Text>
        </TouchableOpacity>
      </View>
    ) : checkedOut ? null : (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.action, styles.actionSolid, !actionable && styles.actionDisabled]}
          activeOpacity={0.85}
          disabled={!actionable}
          onPress={handleCheckOut}>
          <LogOutIcon size={15} color={theme.colors.white} />
          <Text style={styles.actionSolidText}>Check-Out Equipment</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <RecordCard
      onPress={handlePress}
      idLabel={equipment.serial}
      statusPill={
        variant === 'mine' ? null : (
          <StatusPill label={equipment.status} bg={status.bg} fg={status.fg} />
        )
      }
      dateLine={dateLine}
      badge={
        equipment.queuedOffline ? (
          <View style={styles.queuedRow}>
            <CloudOffIcon size={13} color="#C26401" />
            <Text style={styles.queued}>Queued · offline</Text>
          </View>
        ) : undefined
      }
      fields={[
        {label: 'Name', value: equipment.name},
        {label: 'Type', value: equipment.equipmentType},
        {label: 'Category', value: equipment.category},
      ]}
      secondaryFields={
        showCustodyRow
          ? [
              {label: 'Zone', value: equipment.zone},
              {
                label: 'Checked Out By',
                // The mockup renders this one as an avatar + name, not plain
                // text (equipment-hub.js's `c2-person`). It has a photo to
                // show; this app has no per-user image anywhere, so it falls
                // back to initials the way WorkCard's sender avatar does.
                node: <HolderChip name={holderName} />,
              },
              {
                label: 'Checked Out Date',
                value: equipment.checkedOutAt
                  ? formatCardDateOnly(equipment.checkedOutAt)
                  : '—',
              },
            ]
          : [{label: 'Zone', value: equipment.zone}]
      }
      footer={footer}
    />
  );
};

const styles = StyleSheet.create({
  dateRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dateText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textOnGlassMuted,
  },
  holderRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  holderAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holderInitials: {
    fontFamily: theme.fonts.black,
    fontSize: 8,
    color: theme.colors.white,
  },
  // Matches RecordCard's own value text, so the chip reads as the same grid
  // row as the plain-text fields beside it.
  holderName: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textOnGlass,
  },
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  footer: {flexDirection: 'row', gap: theme.spacing.sm},
  action: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.radius.md,
  },
  // Neutral border on white, matching PoiCard's 'Add Update' exactly. The
  // accent border + glass fill this used before made the same control read as
  // a different one between two modules.
  actionGhost: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  actionGhostText: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
  actionSolid: {backgroundColor: theme.colors.primary},
  actionSolidText: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.white,
  },
  actionDisabled: {opacity: 0.45},
});

export default React.memo(EquipmentCard);
