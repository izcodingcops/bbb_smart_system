import {MOCK_CHECKED_IN_EQUIPMENT} from '../../../mocks';
import {sleep} from '../../mockSession';

const STATUS: Record<string, string> = {Active: 'ACTIVE', Overdue: 'OVERDUE'};

export const equipmentResolvers = {
  Query: {
    checkedInEquipment: async () => {
      await sleep();
      return MOCK_CHECKED_IN_EQUIPMENT.map(item => ({
        id: item.id,
        assetTag: item.id,
        name: item.name,
        category: item.category,
        checkedInAt: item.checkedInAt,
        status: STATUS[item.status],
        icon: item.icon,
        tint: item.tint,
        iconColor: item.iconColor,
      }));
    },
  },
};
