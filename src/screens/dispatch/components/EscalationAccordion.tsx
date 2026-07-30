import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  AccordionSection,
  DetailField,
  detailGrid,
  formatDateTime,
} from '../../../components/ui';
import {DispatchEscalation} from '../../../types/dispatch';

interface Props {
  escalation: DispatchEscalation;
  initiallyOpen?: boolean;
}

/** Null-safe wrapper: DetailField renders its own 'N/A' for a null value. */
const at = (iso: string | null): string | null => (iso ? formatDateTime(iso) : null);

const EscalationAccordion: React.FC<Props> = ({escalation, initiallyOpen}) => (
  <AccordionSection title={escalation.label} initiallyOpen={initiallyOpen}>
    <View style={[detailGrid, styles.gridPad]}>
      <DetailField label="Type" value={escalation.type} />
      <DetailField label="Responding Person" value={escalation.respondingPerson} />
      <DetailField label="Time Called" value={at(escalation.timeCalled)} />
      <DetailField label="Time Arrived" value={at(escalation.timeArrived)} />
      <DetailField label="Time Cleared" value={at(escalation.timeCleared)} />
      <DetailField label="Status" value={escalation.status} />
      <DetailField label="Source Notes" value={escalation.notes} full />
    </View>
  </AccordionSection>
);

const styles = StyleSheet.create({
  // AccordionSection's body has almost no bottom padding of its own.
  gridPad: {paddingBottom: 14},
});

export default React.memo(EscalationAccordion);
