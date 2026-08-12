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
  /** Plain text renders with the shell's own dateLine style; pass a node
   *  (e.g. an avatar + name row) for anything richer. */
  dateLine: React.ReactNode;
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
    <Card
      glass
      style={[styles.card, compact && styles.cardCompact]}
      compact={compact}>
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

      {typeof dateLine === 'string' ? (
        <Text style={styles.dateLine}>{dateLine}</Text>
      ) : (
        dateLine
      )}

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
  // Matches the source design's section spacing (.c2-sep margin: 12px 0,
  // .c2-addr margin-top: 12px).
  card: {gap: theme.spacing.md},
  cardCompact: {gap: theme.spacing.md},
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
  id: {fontFamily: theme.fonts.black, fontSize: 16.5, color: '#181B1F'},
  type: {
    flexShrink: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    letterSpacing: 0.2,
    color: theme.colors.textOnGlassSubtle,
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
    fontSize: 12.5,
    color: theme.colors.textOnGlassMuted,
  },
  divider: {height: 1, backgroundColor: theme.colors.dividerOnGlass},
  // .c2-fields gap: 10px in the source design.
  grid: {flexDirection: 'row', gap: 10},
  // minWidth: 0 lets a cell actually shrink below its content's intrinsic
  // width instead of overflowing the row (RN flexbox default).
  gridCell: {flex: 1, minWidth: 0, gap: 4},
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.textOnGlassMuted,
  },
  value: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textOnGlass,
  },
  addressBlock: {gap: 4, marginTop: theme.spacing.md},
});

export default React.memo(RecordCard);
