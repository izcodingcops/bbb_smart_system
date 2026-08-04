import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {formatCardDate, KebabMenu, RecordCard, StatusPill} from '../../../components/ui';
import {CloudOffIcon} from '../../../components/icons';
import {Fixture, FixtureStatus} from '../../../types/fixture';
import {theme} from '../../../theme';

const STATUS_STYLE: Record<FixtureStatus, {bg: string; fg: string}> = {
  Active: {bg: '#DCFCE7', fg: '#16A34A'},
  Inactive: {bg: '#F1F3F5', fg: '#475467'},
};

const TRANSITIONS: Record<FixtureStatus, {status: FixtureStatus; label: string; dot: string}[]> = {
  Active: [{status: 'Inactive', label: 'Mark Inactive', dot: '#475467'}],
  Inactive: [{status: 'Active', label: 'Mark Active', dot: '#16A34A'}],
};

interface Props {
  fixture: Fixture;
  onPress: (fixture: Fixture) => void;
  /** True while this card's own status menu is the open one. */
  menuOpen: boolean;
  /** Opens this card's menu, or closes it if already open. */
  onToggleMenu: (id: string) => void;
  onSelectStatus: (fixture: Fixture, status: FixtureStatus) => void;
}

const FixtureCard: React.FC<Props> = ({fixture, onPress, menuOpen, onToggleMenu, onSelectStatus}) => {
  const status = STATUS_STYLE[fixture.status];
  // A queued placeholder doesn't exist in any store yet, so its status can't
  // be changed until it syncs.
  const actionable = !fixture.queuedOffline;
  const menuOptions = TRANSITIONS[fixture.status].map(option => ({
    value: option.status,
    label: option.label,
    dot: option.dot,
  }));

  return (
    <RecordCard
      onPress={() => onPress(fixture)}
      idLabel={fixture.reference}
      typeLabel={fixture.title}
      statusPill={
        <StatusPill
          label={fixture.status}
          bg={status.bg}
          fg={status.fg}
          onPress={actionable ? () => onToggleMenu(fixture.id) : undefined}
          trailingChevron={actionable}
        />
      }
      kebab={
        <KebabMenu
          visible={actionable}
          open={menuOpen}
          onToggle={() => onToggleMenu(fixture.id)}
          options={menuOptions}
          onSelect={value => onSelectStatus(fixture, value as FixtureStatus)}
        />
      }
      dateLine={formatCardDate(fixture.createdAt)}
      badge={
        fixture.queuedOffline ? (
          <View style={styles.queuedRow}>
            <CloudOffIcon size={13} color="#C26401" />
            <Text style={styles.queued}>Queued · offline</Text>
          </View>
        ) : undefined
      }
      fields={[
        {label: 'Type', value: fixture.fixtureType},
        {label: 'Zone', value: fixture.zone},
        {
          label: 'Created By',
          node: (
            <View style={styles.creator}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{fixture.createdBy.initials}</Text>
              </View>
              <Text style={styles.value} numberOfLines={1}>
                {fixture.createdBy.name}
              </Text>
            </View>
          ),
        },
      ]}
      addressLabel="Address"
      addressValue={fixture.address}
    />
  );
};

const styles = StyleSheet.create({
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
  // Matches RecordCard's own internal `value` style for a custom field node.
  value: {fontFamily: theme.fonts.black, fontSize: 13, color: '#181B1F'},
  creator: {flexDirection: 'row', alignItems: 'center', gap: 6},
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontFamily: theme.fonts.black, fontSize: 9, color: theme.colors.white},
});

export default React.memo(FixtureCard);
