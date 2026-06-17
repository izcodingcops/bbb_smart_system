import {LoginCredentials, LoginResponse} from '../../types/auth';
import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';

export const authService = {
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    client.post<LoginResponse>(ApiEndpoints.login, credentials).then(r => r.data),
};
