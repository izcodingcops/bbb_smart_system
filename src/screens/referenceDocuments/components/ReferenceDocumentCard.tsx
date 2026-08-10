import React from 'react';
import {formatCardDate, RecordCard, StatusPill} from '../../../components/ui';
import {ReferenceDocument} from '../../../types/referenceDocument';

interface Props {
  document: ReferenceDocument;
  onPress: (document: ReferenceDocument) => void;
}

/** Every record in this archive is a closed-out entry — same green as Work's Completed. */
const ReferenceDocumentCard: React.FC<Props> = ({document, onPress}) => (
  <RecordCard
    onPress={() => onPress(document)}
    idLabel={document.reference}
    typeLabel="Cleaning"
    statusPill={<StatusPill label="Completed" bg="#DCFCE7" fg="#16A34A" />}
    dateLine={formatCardDate(document.dateTime)}
    fields={[
      {label: 'Sub-Type', value: document.entryType},
      {label: 'Business Name', value: document.business},
      {label: 'Quantity', value: document.quantity},
    ]}
    addressLabel="Address"
    addressValue={document.address}
  />
);

export default React.memo(ReferenceDocumentCard);
