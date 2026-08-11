import {UserRole} from '../types/auth';
import {Program} from '../types/shift';
import {MOCK_PROGRAMS} from './programs';

export interface MockUser {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  avatar: string;
  enable_shift_entry: boolean;
  role: UserRole;
  programs: Program[];
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    username: 'batman',
    email: 'batman@gmail.com',
    password: 'Temp@123',
    name: 'Batman',
    avatar: 'https://i.pravatar.cc/150?img=1',
    enable_shift_entry: true,
    role: 'ambassador',
    programs: MOCK_PROGRAMS,
  },
  {
    id: '2',
    username: 'taz',
    email: 'taz@gmail.com',
    password: 'Temp@123',
    name: 'Taz',
    avatar: 'https://i.pravatar.cc/150?img=2',
    enable_shift_entry: true,
    role: 'supervisor',
    programs: MOCK_PROGRAMS,
  },
];
