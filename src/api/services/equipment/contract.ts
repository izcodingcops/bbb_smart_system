import {EquipmentItem} from '../../../types/equipment';

export interface EquipmentListResponse {
  status: number;
  data: EquipmentItem[];
}

export interface EquipmentServiceContract {
  getCheckedInEquipment: () => Promise<EquipmentListResponse>;
}
