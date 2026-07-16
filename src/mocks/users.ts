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
  programs: Program[];
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    username: 'johndoe',
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    enable_shift_entry: true,
    programs: MOCK_PROGRAMS,
  },
  {
    id: '2',
    username: 'janesmith',
    email: 'admin@example.com',
    password: 'password123',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?img=2',
    enable_shift_entry: false,
    programs: [MOCK_PROGRAMS[0]],
  },
];
