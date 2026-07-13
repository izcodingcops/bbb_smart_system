export const SESSION_TOKEN_KEY = '@auth_token';
export const SESSION_USER_KEY = '@auth_user';

export const MOCK_MENU_ITEMS = [
  {id: 'home', menu_name: 'Home', screen_name: 'Home', menu_icon: 'home', position: 'bottom'},
];

export const MOCK_USERS = [
  {
    id: '1',
    username: 'johndoe',
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    enable_shift_entry: true,
  },
  {
    id: '2',
    username: 'janesmith',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?img=2',
    enable_shift_entry: false,
  },
];
