import {LoginCredentials, LoginResponse} from '../../../types/auth';

export interface AuthServiceContract {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
}
