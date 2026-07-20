export type EquipmentStatus = 'Active' | 'Overdue';

export interface EquipmentItem {
  id: string; // asset tag, e.g. '#RDO-4471'
  name: string; // e.g. 'Two-Way Radio'
  category: string; // e.g. 'Communication'
  /** Human-readable check-in time, e.g. '7:05 AM'. */
  checkedInAt: string;
  status: EquipmentStatus;
  /** Key into the card's icon map; unknown keys fall back to a generic one. */
  icon: string;
  /** Fill behind the icon. */
  tint: string;
  /** Icon stroke, normally a deeper shade of the tint. */
  iconColor: string;
}
