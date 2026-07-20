import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Card} from '../../../components/ui';
import {BoxIcon, ClockIcon, RadioIcon} from '../../../components/icons';
import {EquipmentItem, EquipmentStatus} from '../../../types/equipment';
import {theme} from '../../../theme';

type IconComponent = React.FC<{size?: number; color?: string}>;

const ICON_MAP: Record<string, IconComponent> = {
  radio: RadioIcon,
  tool: BoxIcon,
};

const STATUS_STYLE: Record<EquipmentStatus, {bg: string; fg: string}> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  Overdue: {bg: '#FEF3C7', fg: '#B45309'},
};

interface Props {
  item: EquipmentItem;
  onCheckout?: (item: EquipmentItem) => void;
}

const EquipmentCard: React.FC<Props> = ({item, onCheckout}) => {
  const Icon = ICON_MAP[item.icon] ?? BoxIcon;
  const status = STATUS_STYLE[item.status];

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconTile, {backgroundColor: item.tint}]}>
          <Icon size={22} color={item.iconColor} />
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            {/* Shrinks so a long name truncates rather than shoving the tag off. */}
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.id}>{item.id}</Text>
          </View>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.timeRow}>
            <ClockIcon size={14} color={theme.colors.textMuted} />
            <Text style={styles.time}>In {item.checkedInAt}</Text>
          </View>
        </View>

        <View style={styles.right}>
          <View style={[styles.badge, {backgroundColor: status.bg}]}>
            <Text style={[styles.badgeText, {color: status.fg}]}>
              {item.status}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkout}
            activeOpacity={0.8}
            onPress={() => onCheckout?.(item)}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  row: {flexDirection: 'row', gap: theme.spacing.md},
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {flex: 1, justifyContent: 'space-between'},
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
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: theme.spacing.sm,
  },
  time: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
  right: {alignItems: 'flex-end', justifyContent: 'space-between'},
  badge: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5},
  badgeText: {fontFamily: theme.fonts.black, fontSize: 12},
  checkout: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 9,
    marginTop: theme.spacing.md,
  },
  checkoutText: {
    fontFamily: theme.fonts.black,
    fontSize: 13.5,
    color: theme.colors.primary,
  },
});

export default React.memo(EquipmentCard);
