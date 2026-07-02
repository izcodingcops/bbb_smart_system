import {LoginCredentials, LoginResponse} from '../../types/auth';
import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';
import {API_MOCKS} from '../../config/apiMocks';
import {mockAuthService} from './mockAuthService';
import {AuthServiceContract} from './contracts';

const liveAuthService = {
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    client.post<LoginResponse>(ApiEndpoints.login, credentials).then(r => r.data),
} satisfies AuthServiceContract;

export const authService: AuthServiceContract = API_MOCKS.auth ? mockAuthService : liveAuthService;
