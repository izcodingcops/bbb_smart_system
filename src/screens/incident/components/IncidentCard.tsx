import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {formatCardDate, KebabMenu, PriorityPill, RecordCard, StatusPill} from '../../../components/ui';
import {CloudOffIcon} from '../../../components/icons';
import {Incident, IncidentPriority, IncidentStatus} from '../../../types/incident';
import {theme} from '../../../theme';

const STATUS_STYLE: Record<IncidentStatus, {bg: string; fg: string}> = {
  Open: {bg: '#F1F3F5', fg: '#475467'},
  'In-progress': {bg: '#FEF3C7', fg: '#B45309'},
  Completed: {bg: '#DCFCE7', fg: '#16A34A'},
};

const PRIORITY_STYLE: Record<IncidentPriority, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

const STATUS_MENU_OPTIONS: {status: IncidentStatus; label: string; dot: string}[] = [
  {status: 'In-progress', label: 'Move to In-progress', dot: '#AD8B00'},
  {status: 'Completed', label: 'Mark Completed', dot: '#389E0D'},
];

/** Completed is terminal, and an unassigned incident is the supervisor's to route. */
export function canChangeStatus(incident: Incident): boolean {
  return incident.status !== 'Completed' && !!incident.assignee;
}

interface Props {
  incident: Incident;
  onPress: (incident: Incident) => void;
  /** True while this card's own status menu is the open one. */
  menuOpen: boolean;
  onToggleMenu: (id: string) => void;
  onSelectStatus: (incident: Incident, status: IncidentStatus) => void;
}

const IncidentCard: React.FC<Props> = ({incident, onPress, menuOpen, onToggleMenu, onSelectStatus}) => {
  const status = STATUS_STYLE[incident.status];
  const actionable = canChangeStatus(incident);
  const menuOptions = (
    incident.status === 'Open'
      ? STATUS_MENU_OPTIONS
      : STATUS_MENU_OPTIONS.filter(option => option.status === 'Completed')
  ).map(option => ({value: option.status, label: option.label, dot: option.dot}));

  return (
    <RecordCard
      onPress={() => onPress(incident)}
      idLabel={incident.reference}
      typeLabel={incident.type}
      statusPill={
        <StatusPill
          label={incident.status}
          bg={status.bg}
          fg={status.fg}
          onPress={actionable ? () => onToggleMenu(incident.id) : undefined}
          trailingChevron={actionable}
        />
      }
      kebab={
        <KebabMenu
          visible={actionable}
          open={menuOpen}
          onToggle={() => onToggleMenu(incident.id)}
          options={menuOptions}
          onSelect={value => onSelectStatus(incident, value as IncidentStatus)}
        />
      }
      dateLine={`${formatCardDate(incident.occurredAt)}${
        incident.status === 'Open' && !incident.assignee ? ' · Escalated to supervisor' : ''
      }`}
      badge={
        incident.queuedOffline ? (
          <View style={styles.queuedRow}>
            <CloudOffIcon size={13} color="#C26401" />
            <Text style={styles.queued}>Queued · offline</Text>
          </View>
        ) : undefined
      }
      fields={[
        {label: 'Zone', value: incident.zone},
        {
          label: 'Priority',
          node: (
            <PriorityPill
              label={incident.priority}
              bg={PRIORITY_STYLE[incident.priority].bg}
              fg={PRIORITY_STYLE[incident.priority].fg}
            />
          ),
        },
        {label: 'Outcome', value: incident.outcome},
      ]}
      addressLabel="Address"
      addressValue={incident.address}
    />
  );
};

const styles = StyleSheet.create({
  queuedRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  queued: {fontFamily: theme.fonts.black, fontSize: 12, color: '#C26401'},
});

export default React.memo(IncidentCard);
