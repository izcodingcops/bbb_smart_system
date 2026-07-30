import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  AccordionSection,
  DetailField,
  detailGrid,
  formatDateTimeOrNull,
} from '../../../components/ui';
import {DispatchEscalation} from '../../../types/dispatch';

interface Props {
  escalation: DispatchEscalation;
  initiallyOpen?: boolean;
}

const EscalationAccordion: React.FC<Props> = ({escalation, initiallyOpen}) => (
  <AccordionSection title={escalation.label} initiallyOpen={initiallyOpen}>
    <View style={[detailGrid, styles.gridPad]}>
      <DetailField label="Type" value={escalation.type} />
      <DetailField label="Responding Person" value={escalation.respondingPerson} />
      <DetailField label="Time Called" value={formatDateTimeOrNull(escalation.timeCalled)} />
      <DetailField label="Time Arrived" value={formatDateTimeOrNull(escalation.timeArrived)} />
      <DetailField label="Time Cleared" value={formatDateTimeOrNull(escalation.timeCleared)} />
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
