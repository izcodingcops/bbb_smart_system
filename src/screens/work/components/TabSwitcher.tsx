import React from 'react';
import {SegmentedTabItem, SegmentedTabs} from '../../../components/ui';
import {UserRole} from '../../../types/auth';
import {WorkBucket} from '../../../types/work';

interface Props {
  bucket: WorkBucket;
  role: UserRole;
  assignedCount: number;
  unassignedCount: number;
  completedCount: number;
  onChange: (bucket: WorkBucket) => void;
}

/**
 * Work's bucket switcher. The control itself is the shared `SegmentedTabs` —
 * Equipment's hub ships the same one, so it lives in components/ui rather than
 * being duplicated here. This file is only the role-dependent tab list:
 * Unassigned is a supervisor triage bucket and is absent for ambassadors.
 */
const TabSwitcher: React.FC<Props> = ({
  bucket,
  role,
  assignedCount,
  unassignedCount,
  completedCount,
  onChange,
}) => {
  const tabs: SegmentedTabItem[] = [
    {key: 'assigned', label: 'Assigned', count: assignedCount},
    ...(role === 'supervisor'
      ? [{key: 'unassigned', label: 'Unassigned', count: unassignedCount}]
      : []),
    {key: 'completed', label: 'Completed', count: completedCount},
  ];

  return (
    <SegmentedTabs
      tabs={tabs}
      activeKey={bucket}
      onSelect={key => onChange(key as WorkBucket)}
    />
  );
};

export default TabSwitcher;
