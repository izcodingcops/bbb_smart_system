import React from 'react';
import {formatCardDate, PriorityPill, RecordCard, StatusPill} from '../../../components/ui';
import {Dispatch, DispatchPriority, DispatchStatus} from '../../../types/dispatch';

const STATUS_STYLE: Record<DispatchStatus, {bg: string; fg: string}> = {
  Open: {bg: '#EFF6FF', fg: '#1D4ED8'},
  Escalated: {bg: '#FEF3C7', fg: '#B45309'},
  Closed: {bg: '#F1F3F5', fg: '#475467'},
};

/** Same tones the Maintenance and Work cards use for priority. */
const PRIORITY_STYLE: Record<DispatchPriority, {bg: string; fg: string}> = {
  High: {bg: '#FFF2F0', fg: '#CF1322'},
  Medium: {bg: '#FFFBE6', fg: '#AD8B00'},
  Low: {bg: '#F6FFED', fg: '#389E0D'},
};

interface Props {
  dispatch: Dispatch;
  onPress: (dispatch: Dispatch) => void;
}

const DispatchCard: React.FC<Props> = ({dispatch, onPress}) => {
  const status = STATUS_STYLE[dispatch.status];
  const priority = PRIORITY_STYLE[dispatch.priority];

  return (
    <RecordCard
      onPress={() => onPress(dispatch)}
      idLabel={dispatch.reference}
      // The design's own card label — a dispatch has no per-record title.
      typeLabel="Dispatch"
      statusPill={
        <StatusPill label={dispatch.status} bg={status.bg} fg={status.fg} />
      }
      dateLine={formatCardDate(dispatch.createdAt)}
      fields={[
        {label: 'Type of Activity', value: dispatch.typeOfActivity},
        {
          label: 'Priority',
          node: (
            <PriorityPill
              label={dispatch.priority}
              bg={priority.bg}
              fg={priority.fg}
            />
          ),
        },
        {label: 'How Referred', value: dispatch.howReferred},
      ]}
      addressLabel="Address"
      addressValue={dispatch.address}
    />
  );
};

export default React.memo(DispatchCard);
