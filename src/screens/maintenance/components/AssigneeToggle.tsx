import React from 'react';
import {IconToggleCards, IconToggleOption} from '../../../components/ui';
import {
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from '../../../components/icons';
import {MaintenanceAssigneeKind} from '../../../types/maintenance';

export interface AssigneeOption {
  kind: MaintenanceAssigneeKind;
  label: string;
}

interface Props {
  /** Role-gated by the caller; this component just renders what it is given. */
  options: AssigneeOption[];
  value: MaintenanceAssigneeKind;
  onChange: (kind: MaintenanceAssigneeKind) => void;
}

const ICON: Record<MaintenanceAssigneeKind, React.FC<{size?: number; color?: string}>> = {
  Supervisor: UserIcon,
  Department: UsersIcon,
  Ambassador: UserPlusIcon,
  Me: UserIcon,
};

/** Thin adapter over the shared `IconToggleCards` — see that component for the visuals. */
const AssigneeToggle: React.FC<Props> = ({options, value, onChange}) => {
  const cardOptions: IconToggleOption<MaintenanceAssigneeKind>[] = options.map(option => ({
    value: option.kind,
    label: option.label,
    Icon: ICON[option.kind],
  }));

  return <IconToggleCards options={cardOptions} value={value} onChange={onChange} />;
};

export default AssigneeToggle;
