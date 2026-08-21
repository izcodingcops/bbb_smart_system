import React from 'react';
import {formatCardDate, PersonChip, PriorityPill, RecordCard, StatusPill} from '../../../components/ui';
import {AmbassadorWork} from '../../../types/ambassador';
import {priorityForPoints} from '../workFiltering';

const STATUS_STYLE: Record<AmbassadorWork['status'], {bg: string; fg: string}> = {
  Completed: {bg: '#F6FFED', fg: '#389E0D'},
  'In Progress': {bg: '#FFFBE6', fg: '#AD8B00'},
  Open: {bg: '#EEF0F2', fg: '#5B5F66'},
};

const PRIORITY_STYLE: Record<ReturnType<typeof priorityForPoints>, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

interface Props {
  work: AmbassadorWork;
  /** Maintenance's 'Assigned To' is always the ambassador whose profile this list belongs to. */
  ambassadorName: string;
  onPress: (work: AmbassadorWork) => void;
}

/**
 * The handoff's `card2`: id + type in the header, a status pill, a date line,
 * then either Cleaning's Sub-Type/Business Name/Quantity or Maintenance's
 * Type/Priority/Assigned To, and a full-width Address row.
 */
const AmbassadorWorkCard: React.FC<Props> = ({work, ambassadorName, onPress}) => {
  const status = STATUS_STYLE[work.status];
  const priority = priorityForPoints(work.points);
  const priorityTone = PRIORITY_STYLE[priority];
  const fields =
    work.type === 'Maintenance'
      ? [
          {label: 'Type', value: work.subType},
          {
            label: 'Priority',
            node: <PriorityPill label={priority} bg={priorityTone.bg} fg={priorityTone.fg} />,
          },
          {label: 'Assigned To', node: <PersonChip name={ambassadorName} />},
        ]
      : [
          {label: 'Sub-Type', value: work.subType},
          {label: 'Business Name', value: work.businessName || 'N/A'},
          {label: 'Quantity', value: work.quantity},
        ];

  return (
    <RecordCard
      onPress={() => onPress(work)}
      idLabel={work.reference}
      typeLabel={work.type}
      statusPill={<StatusPill label={work.status} bg={status.bg} fg={status.fg} />}
      dateLine={formatCardDate(work.date)}
      fields={fields}
      addressLabel="Address"
      addressValue={work.address}
    />
  );
};

export default React.memo(AmbassadorWorkCard);
