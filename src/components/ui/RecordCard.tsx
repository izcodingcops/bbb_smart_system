import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Card from './Card';
import {theme} from '../../theme';

export interface RecordCardField {
  label: string;
  /** Rendered with the shell's own label/value text styles. */
  value?: string;
  /** Overrides `value` — for a priority pill, an avatar+name row, etc. */
  node?: React.ReactNode;
}

interface Props {
  onPress?: () => void;
  idLabel: string;
  typeLabel: string;
  /** Caller renders its own <StatusPill>, so it owns the color/transition policy. */
  statusPill: React.ReactNode;
  /** Caller renders its own <KebabMenu>, or omits it entirely. */
  kebab?: React.ReactNode;
  dateLine: string;
  /** A fully-formed node, e.g. Maintenance's 'Queued · offline' row. */
  badge?: React.ReactNode;
  fields: RecordCardField[];
  addressLabel?: string;
  addressValue?: string;
  /**
   * Rendered before the id/type block — POI's person avatar. Every other
   * module omits it and its header row is unchanged.
   */
  leading?: React.ReactNode;
  /** Rendered under the address block — POI's two action buttons. */
  footer?: React.ReactNode;
  compact?: boolean;
}

const RecordCard: React.FC<Props> = ({
  onPress,
  idLabel,
  typeLabel,
  statusPill,
  kebab,
  dateLine,
  badge,
  fields,
  addressLabel,
  addressValue,
  leading,
  footer,
  compact,
}) => {
  const body = (
    <Card style={[styles.card, compact && styles.cardCompact]} compact={compact}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {leading}
          <Text style={styles.id}>{idLabel}</Text>
          <Text style={styles.type} numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {statusPill}
          {kebab}
        </View>
      </View>

      <Text style={styles.dateLine}>{dateLine}</Text>

      {badge}

      <View style={styles.divider} />

      <View style={styles.grid}>
        {fields.map(field => (
          <View key={field.label} style={styles.gridCell}>
            <Text style={styles.label}>{field.label}</Text>
            {field.node ?? (
              <Text style={styles.value} numberOfLines={1}>
                {field.value}
              </Text>
            )}
          </View>
        ))}
      </View>

      {addressLabel && addressValue ? (
        <View style={styles.addressBlock}>
          <Text style={styles.label}>{addressLabel}</Text>
          <Text style={styles.value}>{addressValue}</Text>
        </View>
      ) : null}

      {footer}
    </Card>
  );

  return onPress ? (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      {body}
    </TouchableOpacity>
  ) : (
    body
  );
};

const styles = StyleSheet.create({
  card: {gap: theme.spacing.sm},
  cardCompact: {gap: theme.spacing.xs},
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
  // Anchors KebabMenu's popover — it positions absolute against this.
  headerRight: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dateLine: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  divider: {height: 1, backgroundColor: '#EEF0F2'},
  grid: {flexDirection: 'row', gap: theme.spacing.sm},
  gridCell: {flex: 1, gap: 4},
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  value: {fontFamily: theme.fonts.black, fontSize: 13, color: '#181B1F'},
  addressBlock: {gap: 4, marginTop: theme.spacing.xs},
});

export default React.memo(RecordCard);
