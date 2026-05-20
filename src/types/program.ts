export interface Program {
  id: string;
  program_name: string;
  timezone_str?: string;
  time_zone?: number;
  shift_enabled?: boolean;
  civicity?: boolean;
}

export interface ProgramState {
  programs: Program[];
  selectedProgram: Program | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProgramListResponse {
  status: number;
  data: Program[];
}
