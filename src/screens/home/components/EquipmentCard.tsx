import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Card, formatCardDate} from '../../../components/ui';
import {BoxIcon, CloudOffIcon, CubeIcon, RadioIcon, ToolsIcon} from '../../../components/icons';
import {Equipment} from '../../../types/equipment';
import {theme} from '../../../theme';

type IconComponent = React.FC<{size?: number; color?: string}>;

interface Visual {
  Icon: IconComponent;
  tint: string;
  color: string;
}

/** Keyed by category; anything unlisted falls back to GENERIC. */
const GENERIC: Visual = {Icon: BoxIcon, tint: '#EEF2FF', color: '#2B4ACB'};

const CATEGORY_VISUAL: Record<string, Visual> = {
  'Communication Device': {Icon: RadioIcon, tint: '#EDE9FE', color: '#6D4AFF'},
  'Cleaning Equipment': {Icon: ToolsIcon, tint: '#DCEBFF', color: '#0066B2'},
  'Power Wash Truck': {Icon: ToolsIcon, tint: '#DCEBFF', color: '#0066B2'},
  'Landscape Power Tool': {Icon: ToolsIcon, tint: '#FEF3C7', color: '#B45309'},
  'Power Tool': {Icon: ToolsIcon, tint: '#FEF3C7', color: '#B45309'},
  Vehicle: {Icon: CubeIcon, tint: '#DCFCE7', color: '#16A34A'},
  Bicycle: {Icon: CubeIcon, tint: '#DCFCE7', color: '#16A34A'},
};

interface Props {
  item: Equipment;
  onCheckIn?: (item: Equipment) => void;
}

const EquipmentCard: React.FC<Props> = ({item, onCheckIn}) => {
  const visual = CATEGORY_VISUAL[item.category] ?? GENERIC;
  const {Icon} = visual;
  // A queued Check-In for this record hasn't synced yet, so firing another
  // custody action here would queue a second mutation on top of the first
  // with no feedback to the user. Mirrors the equipment hub's list card
  // (src/screens/equipment/components/EquipmentCard.tsx).
  const queued = item.queuedOffline;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconTile, {backgroundColor: visual.tint}]}>
          <Icon size={22} color={visual.color} />
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            {/* Shrinks so a long name truncates rather than shoving the tag off. */}
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.id}>{item.reference}</Text>
          </View>
          <Text style={styles.category}>{item.category}</Text>
          {queued ? (
            <View style={styles.queuedRow}>
              <CloudOffIcon size={12} color="#C26401" />
              <Text style={styles.queuedText}>Queued · offline</Text>
            </View>
          ) : (
            <Text style={styles.time}>
              {item.checkedOutAt ? `Out ${formatCardDate(item.checkedOutAt)}` : 'Out'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.checkIn, queued && styles.checkInDisabled]}
          activeOpacity={0.8}
          disabled={queued}
          onPress={() => onCheckIn?.(item)}>
          <Text style={styles.checkInText}>Check-In</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  row: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {flex: 1, gap: 2},
  nameRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  name: {
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    color: '#181B1F',
  },
  id: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textMuted,
  },
  category: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  time: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queuedText: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  checkIn: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 9,
  },
  checkInDisabled: {opacity: 0.45},
  checkInText: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
});

export default React.memo(EquipmentCard);
