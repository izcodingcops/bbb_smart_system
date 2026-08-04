import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  AccordionSection,
  DetailField,
  StatusPill,
  detailGrid,
  formatDateTimeOrNull,
} from '../../../components/ui';
import {DispatchEscalation} from '../../../types/dispatch';

interface Props {
  escalation: DispatchEscalation;
  initiallyOpen?: boolean;
}

// The mockup shows this pill outlined (white fill, hairline border), but
// StatusPill is fill-only — it has no border support, and this fix
// deliberately doesn't add one to a shared primitive. So we tint it instead,
// matching every other size="md" status pill in the app. `status` is a
// free-form string (only ever 'Open' in seeded data), so unrecognised values
// fall back to the same "Open" tones rather than indexing into undefined —
// reusing DispatchCard's STATUS_STYLE.Open / ViewDispatchScreen's own
// dispatch-status tones.
const OPEN_STATUS_STYLE = {bg: '#EFF6FF', fg: '#1D4ED8'};

const EscalationAccordion: React.FC<Props> = ({escalation, initiallyOpen}) => (
  <AccordionSection title={escalation.label} initiallyOpen={initiallyOpen}>
    <View style={[detailGrid, styles.gridPad]}>
      <DetailField label="Type" value={escalation.type} />
      <DetailField label="Responding Person" value={escalation.respondingPerson} />
      <DetailField label="Time Called" value={formatDateTimeOrNull(escalation.timeCalled)} />
      <DetailField label="Time Arrived" value={formatDateTimeOrNull(escalation.timeArrived)} />
      <DetailField label="Time Cleared" value={formatDateTimeOrNull(escalation.timeCleared)} />
      <DetailField label="Status">
        <StatusPill
          label={escalation.status}
          bg={OPEN_STATUS_STYLE.bg}
          fg={OPEN_STATUS_STYLE.fg}
          size="md"
        />
      </DetailField>
      <DetailField label="Source Notes" value={escalation.notes} full />
    </View>
  </AccordionSection>
);

const styles = StyleSheet.create({
  // AccordionSection's body has almost no bottom padding of its own.
  gridPad: {paddingBottom: 14},
});

export default React.memo(EscalationAccordion);
