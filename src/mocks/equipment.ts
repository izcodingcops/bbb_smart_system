import {EquipmentItem} from '../types/equipment';

export const MOCK_CHECKED_IN_EQUIPMENT = [
  {
    id: '#RDO-4471',
    name: 'Two-Way Radio',
    category: 'Communication',
    checkedInAt: '2026-07-29T07:05:00',
    status: 'Active',
    icon: 'radio',
    tint: '#EDE9FE',
    iconColor: '#6D4AFF',
  },
  {
    id: '#LP-2093',
    name: 'Litter Picker',
    category: 'Cleaning Tool',
    checkedInAt: '2026-07-29T07:06:00',
    status: 'Active',
    icon: 'tool',
    tint: '#DCEBFF',
    iconColor: '#0066B2',
  },
] satisfies EquipmentItem[];
