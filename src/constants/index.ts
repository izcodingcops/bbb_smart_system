export const SESSION_TOKEN_KEY = '@auth_token';
export const SESSION_USER_KEY = '@auth_user';

export const MOCK_MENU_ITEMS = [
  {id: 'home', menu_name: 'Home', screen_name: 'Home', menu_icon: 'home', position: 'bottom'},
];

export const MOCK_PROGRAMS = [
  {id: 'p1', name: 'Downtown Denver BID', address: '16th Street Mall · Denver, CO'},
  {id: 'p2', name: 'Cherry Creek North BID', address: '2nd & Fillmore · Denver, CO'},
  {id: 'p3', name: 'RiNo Art District', address: 'Larimer Street · Denver, CO'},
  {
    id: 'p4',
    name: 'Golden Triangle Creative District',
    address: 'Bannock Street · Denver, CO',
  },
];

export const MOCK_SHIFT_TYPES = [
  {id: 'st1', name: 'Cleaning', icon: 'cleaning'},
  {id: 'st2', name: 'General', icon: 'general'},
  {id: 'st3', name: 'Hospitality', icon: 'hospitality'},
  {id: 'st4', name: 'Management', icon: 'management'},
  {id: 'st5', name: 'Outreach', icon: 'outreach'},
  {id: 'st6', name: 'Safety', icon: 'safety'},
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
