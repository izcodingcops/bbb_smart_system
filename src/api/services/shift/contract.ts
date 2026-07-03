export interface StartShiftBody {
  actual_shift_date: string;
  actual_shift_end_date: string;
  task_id: string | number;
  program_id: string | number;
  timezone_str: string;
  server_date: string;
}

export interface ShiftServiceContract {
  startShift: (body: StartShiftBody) => Promise<{status: number; data: any}>;
}
