export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  enable_shift_entry?: boolean;
}

export interface Session {
  token: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
  login_type: number;
}

export interface LoginResponse {
  status: number;
  message: string;
  data: {
    token: string;
    enable_shift_entry: boolean;
    id: string | number;
    name: string;
    username: string;
    email?: string;
    avatar?: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
}
