import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {formatDateTime} from '../../../components/ui';
import {AlertTriangleIcon} from '../../../components/icons';
import {PoiInteraction, PoiUpdate} from '../../../types/poi';
import {theme} from '../../../theme';

/**
 * The read-only history rows on the detail screen. Interactions and Updates
 * are append-only — no edit, no delete — so unlike CommentList these rows carry
 * no actions.
 */

interface Row {
  key: string;
  /** The bold left-hand label: an interaction's type, an update's zone. */
  heading: string;
  occurredAt: string;
  body: string | null;
  /** Only interactions have one. */
  violation?: string | null;
}

const TimelineRow: React.FC<{row: Row}> = ({row}) => (
  <View style={styles.item}>
    <View style={styles.top}>
      <Text style={styles.heading} numberOfLines={1}>
        {row.heading}
      </Text>
      <Text style={styles.date}>{formatDateTime(row.occurredAt)}</Text>
    </View>
    {row.body ? <Text style={styles.body}>{row.body}</Text> : null}
    {row.violation ? (
      <View style={styles.violation}>
        <AlertTriangleIcon size={12} color="#B45309" />
        <Text style={styles.violationText}>{row.violation}</Text>
      </View>
    ) : null}
  </View>
);

export const PoiInteractionTimeline: React.FC<{
  interactions: PoiInteraction[];
}> = ({interactions}) => {
  if (interactions.length === 0) {
    return <Text style={styles.empty}>No interactions logged yet.</Text>;
  }
  return (
    <View style={styles.list}>
      {interactions.map(interaction => (
        <TimelineRow
          key={interaction.id}
          row={{
            key: interaction.id,
            heading: interaction.interactionType,
            occurredAt: interaction.occurredAt,
            body: interaction.note,
            violation: interaction.violation,
          }}
        />
      ))}
    </View>
  );
};

export const PoiUpdateTimeline: React.FC<{updates: PoiUpdate[]}> = ({
  updates,
}) => {
  if (updates.length === 0) {
    return <Text style={styles.empty}>No updates logged yet.</Text>;
  }
  return (
    <View style={styles.list}>
      {updates.map(update => (
        <TimelineRow
          key={update.id}
          row={{
            key: update.id,
            heading: update.zone,
            occurredAt: update.occurredAt,
            body: update.description,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {gap: theme.spacing.sm},
  item: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8F9FB',
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  heading: {
    flexShrink: 1,
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  date: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  body: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  violation: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  violationText: {
    fontFamily: theme.fonts.black,
    fontSize: 12,
    color: '#B45309',
  },
  empty: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textMuted,
  },
});
