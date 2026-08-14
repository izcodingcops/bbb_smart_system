export interface EquipmentToast {
  title: string;
  message: string;
  /** Equipment id the toast's View action opens; empty for non-navigating toasts. */
  routeId: string;
  variant?: 'success' | 'danger';
}

export type EquipmentStackParamList = {
  EquipmentList: {toast?: EquipmentToast; initialTab?: 'all' | 'mine'} | undefined;
  EquipmentCreate: undefined;
  EquipmentView: {id: string; initialTab?: 'equipment' | 'upkeep'};
  EquipmentCheckOut: {id: string};
  EquipmentCheckIn: {id: string};
  /** `origin` decides where a successful submit pops back to — see EquipmentNavigator. */
  EquipmentAddUpkeep: {id: string; origin: 'list' | 'detail'};
  EquipmentScan: undefined;
};
