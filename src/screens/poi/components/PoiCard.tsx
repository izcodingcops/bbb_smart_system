import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  formatCardDate,
  RecordCard,
  StatusPill,
} from '../../../components/ui';
import {
  ClockIcon,
  CloudOffIcon,
  MessageSquareIcon,
} from '../../../components/icons';
import {Poi} from '../../../types/poi';
import {DISPOSITION_STYLE} from '../filtering';
import {theme} from '../../../theme';

/** 'James Rivera' → 'JR'. The design uses stock photos; this app has none. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

interface Props {
  poi: Poi;
  onPress: (poi: Poi) => void;
  onAddInteraction: (poi: Poi) => void;
  onAddUpdate: (poi: Poi) => void;
}

const PoiCard: React.FC<Props> = ({
  poi,
  onPress,
  onAddInteraction,
  onAddUpdate,
}) => {
  const disposition = DISPOSITION_STYLE[poi.disposition];
  // A queued placeholder doesn't exist in any store yet, so nothing can be
  // attached to it until it syncs.
  const actionable = !poi.queuedOffline;

  return (
    <RecordCard
      onPress={() => onPress(poi)}
      leading={
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(poi.name)}</Text>
        </View>
      }
      // idLabel and typeLabel are positional slots, not semantic ones: the
      // design puts the person's name first and the record reference second.
      idLabel={poi.name}
      typeLabel={poi.reference}
      statusPill={
        <StatusPill
          label={poi.disposition}
          bg={disposition.bg}
          fg={disposition.fg}
        />
      }
      dateLine={formatCardDate(poi.lastModifiedAt)}
      badge={
        poi.queuedOffline ? (
          <View style={styles.queuedRow}>
            <CloudOffIcon size={13} color="#C26401" />
            <Text style={styles.queued}>Queued · offline</Text>
          </View>
        ) : undefined
      }
      fields={[
        {label: 'Type', value: poi.personType},
        {label: 'Zone', value: poi.zone},
        {
          label: 'Interactions',
          node: (
            <View style={styles.count}>
              <MessageSquareIcon size={13} color={theme.colors.textSecondary} />
              <Text style={styles.value}>{poi.interactionCount}</Text>
            </View>
          ),
        },
      ]}
      addressLabel="Address"
      addressValue={poi.address}
      footer={
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.action, !actionable && styles.actionDisabled]}
            activeOpacity={0.85}
            disabled={!actionable}
            onPress={() => onAddUpdate(poi)}>
            <ClockIcon size={15} color={theme.colors.primary} />
            <Text style={styles.actionText}>Add Update</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.action,
              styles.actionPrimary,
              !actionable && styles.actionDisabled,
            ]}
            activeOpacity={0.85}
            disabled={!actionable}
            onPress={() => onAddInteraction(poi)}>
            <MessageSquareIcon size={15} color={theme.colors.white} />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>
              Add Interaction
            </Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  avatarText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: theme.colors.primary,
  },
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  count: {flexDirection: 'row', alignItems: 'center', gap: 5},
  // Matches RecordCard's own internal `value` style for a custom field node.
  value: {fontFamily: theme.fonts.black, fontSize: 13, color: '#181B1F'},
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F2',
  },
  action: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  actionPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionDisabled: {opacity: 0.45},
  actionText: {
    fontFamily: theme.fonts.black,
    fontSize: 12.5,
    color: theme.colors.primary,
  },
  actionTextPrimary: {color: theme.colors.white},
});

export default React.memo(PoiCard);
