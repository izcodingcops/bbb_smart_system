export interface EquipmentToast {
  title: string;
  message: string;
  /** Equipment id the toast's View action opens; empty for non-navigating toasts. */
  routeId: string;
  variant?: 'success' | 'danger';
}

export type EquipmentStackParamList = {
  EquipmentList: {toast?: EquipmentToast; initialTab?: 'all' | 'mine'} | undefined;
  EquipmentView: {id: string};
};
