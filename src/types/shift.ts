export interface Program {
  id: string;
  name: string;
  address: string;
}

export interface ShiftType {
  id: string;
  name: string;
  // Icon key mapped to a component in the shift-setup screen.
  icon: string;
}

export interface ShiftState {
  shiftTypeId: string | null;
  startTime: string | null; // ISO string
  stopTime: string | null; // ISO string; when autoEnd, derived from startTime
  autoEnd: boolean;
  isActive: boolean;
}
