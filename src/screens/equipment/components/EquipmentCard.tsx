import React, {useCallback} from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {RecordCard, StatusPill, formatCardDate, formatCardDateOnly} from '../../../components/ui';
import {CalendarIcon, ClockIcon, LogInIcon, LogOutIcon} from '../../../components/icons';
import {Equipment, EquipmentStatus} from '../../../types/equipment';
import {theme} from '../../../theme';

const STATUS_STYLE: Record<EquipmentStatus, {bg: string; fg: string}> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  'Checked-Out': {bg: '#E6F4FF', fg: '#0066B2'},
};

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
          style={[styles.action, styles.actionGhost]}
          activeOpacity={0.85}
          onPress={handleAddUpkeep}>
          <ClockIcon size={15} color={theme.colors.primary} />
          <Text style={styles.actionGhostText}>Add Upkeep</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.action, styles.actionSolid]}
          activeOpacity={0.85}
          onPress={handleCheckIn}>
          <LogInIcon size={15} color={theme.colors.white} />
          <Text style={styles.actionSolidText}>Check-In</Text>
        </TouchableOpacity>
      </View>
    ) : checkedOut ? null : (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.action, styles.actionSolid]}
          activeOpacity={0.85}
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
                value: equipment.mine ? 'Me' : equipment.checkedOutBy ?? '—',
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
  actionGhost: {
    borderWidth: 1.5,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.glass.buttonFill,
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
});

export default React.memo(EquipmentCard);
