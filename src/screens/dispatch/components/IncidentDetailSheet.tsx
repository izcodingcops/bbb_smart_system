import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  BottomSheet,
  DetailField,
  DetailSection,
  PriorityPill,
  formatDateTime,
  formatDateTimeOrNull,
} from '../../../components/ui';
import {
  DispatchIncident,
  DispatchPriority,
  DispatchResponderInfo,
} from '../../../types/dispatch';
import {theme} from '../../../theme';

const PRIORITY_STYLE: Record<DispatchPriority, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

interface Props {
  visible: boolean;
  /** Null between opens — the sheet renders nothing rather than stale data. */
  incident: DispatchIncident | null;
  onClose: () => void;
}

/** Static chip row; N/A when the list is empty. */
const Chips: React.FC<{values: string[]}> = ({values}) =>
  values.length > 0 ? (
    <View style={styles.chips}>
      {values.map(value => (
        <View key={value} style={styles.chip}>
          <Text style={styles.chipText}>{value}</Text>
        </View>
      ))}
    </View>
  ) : (
    <Text style={styles.na}>N/A</Text>
  );

/** Police and Fire share this three-field shape; EMS adds a responder field. */
const responderFields = (info: DispatchResponderInfo, nameLabel: string) => (
  <>
    <DetailField label={nameLabel} value={info.name} />
    <DetailField label="Time Called" value={formatDateTimeOrNull(info.timeCalled)} />
    <DetailField label="Arrived Time" value={formatDateTimeOrNull(info.timeArrived)} full />
  </>
);

const IncidentDetailSheet: React.FC<Props> = ({visible, incident, onClose}) => (
  <BottomSheet visible={visible} title="Incident Details" onClose={onClose}>
    {incident ? (
      <View style={styles.body}>
        <View style={styles.idRow}>
          <Text style={styles.idBig}>{incident.reference}</Text>
          <PriorityPill
            label={`${incident.priority} Priority`}
            bg={PRIORITY_STYLE[incident.priority].bg}
            fg={PRIORITY_STYLE[incident.priority].fg}
            size="md"
          />
        </View>

        <DetailSection title="Basic Details">
          <DetailField label="Ambassador" value={incident.ambassador} />
          <DetailField label="Type" value={incident.incidentType} />
          <DetailField label="Outcome" value={incident.outcome} />
          <DetailField label="Priority" value={incident.priority} />
          <DetailField label="Created By" value={incident.createdBy} />
          <DetailField label="Report Status" value={incident.reportStatus} />
          <DetailField label="Incident Date & Time" value={formatDateTime(incident.occurredAt)} />
          <DetailField label="Last Modified By" value={incident.lastModifiedBy} />
          <DetailField
            label="Last Modified Date"
            value={formatDateTimeOrNull(incident.lastModifiedAt)}
            full
          />
        </DetailSection>

        <DetailSection title="Location Details">
          <DetailField label="Address" value={incident.address} full />
          <DetailField label="Describe Location" value={incident.describeLocation} />
          <DetailField label="Latitude" value={incident.latitude} />
          <DetailField label="Longitude" value={incident.longitude} />
          <DetailField label="Zone" value={incident.zone} full />
        </DetailSection>

        <DetailSection title="Other Details">
          <DetailField label="Business Name" value={incident.businessName} />
          <DetailField label="Fixture" value={incident.fixture} />
          <DetailField label="Description" value={incident.notes} />
          <DetailField
            label="Document"
            value={incident.documentCount > 0 ? `${incident.documentCount} file(s)` : null}
          />
          <DetailField label="Supervisor Status" value={incident.supervisorStatus} />
          <DetailField label="Report Status" value={incident.reportStatus} />
        </DetailSection>

        <DetailSection title="Is Police Involved?">
          {responderFields(incident.police, 'Officer Name')}
        </DetailSection>

        <DetailSection title="Is Fire Fighter Involved?">
          {responderFields(incident.fire, 'Fire Engine Name')}
        </DetailSection>

        <DetailSection title="Is EMS Involved?">
          <DetailField label="EMS Company Name" value={incident.ems.name} />
          <DetailField label="Responder Name" value={incident.ems.responder} />
          <DetailField label="Time Called" value={formatDateTimeOrNull(incident.ems.timeCalled)} />
          <DetailField
            label="Arrived Time"
            value={formatDateTimeOrNull(incident.ems.timeArrived)}
          />
        </DetailSection>

        <DetailSection title="Is Client Involved?">
          <DetailField label="Client Name" value={incident.clientName} full />
        </DetailSection>

        <DetailSection title="Parties Detail">
          {incident.parties.length > 0 ? (
            incident.parties.map((party, index) => (
              <React.Fragment key={`${party.name ?? 'party'}-${index}`}>
                <DetailField label="Name" value={party.name} />
                <DetailField label="Type" value={party.type} />
                <DetailField label="Business / ORG" value={party.organization} />
                <DetailField label="Street Address" value={party.streetAddress} />
                <DetailField label="Phone No" value={party.phone} />
                <DetailField label="Email" value={party.email} />
              </React.Fragment>
            ))
          ) : (
            <DetailField label="Name" full />
          )}
        </DetailSection>

        <DetailSection title="Vehicle Details">
          {incident.vehicles.length > 0 ? (
            incident.vehicles.map((vehicle, index) => (
              <React.Fragment key={`${vehicle.licenseNumber ?? 'vehicle'}-${index}`}>
                <DetailField label="Year" value={vehicle.year} />
                <DetailField label="Make" value={vehicle.make} />
                <DetailField label="Model" value={vehicle.model} />
                <DetailField label="Color" value={vehicle.color} />
                <DetailField label="License No" value={vehicle.licenseNumber} full />
              </React.Fragment>
            ))
          ) : (
            <DetailField label="Year" full />
          )}
        </DetailSection>

        <DetailSection title="Connected Elements">
          <DetailField label="Maintenance" full>
            <Chips values={incident.connectedMaintenance} />
          </DetailField>
          <DetailField label="Person of Interest" full>
            <Chips values={incident.connectedPois} />
          </DetailField>
          <DetailField label="Equipment" full>
            <Chips values={incident.connectedEquipment} />
          </DetailField>
        </DetailSection>
      </View>
    ) : null}
  </BottomSheet>
);

const styles = StyleSheet.create({
  // Cancels BottomSheet's own horizontal padding: DetailSection brings its own.
  body: {marginHorizontal: -theme.spacing.lg},
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  idBig: {
    flex: 1,
    fontFamily: theme.fonts.black,
    fontSize: 22,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F4F5F7',
  },
  chipText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.text,
  },
  na: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
});

export default IncidentDetailSheet;
