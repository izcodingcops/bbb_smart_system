export const SESSION_TOKEN_KEY = '@auth_token';
export const SESSION_USER_KEY = '@auth_user';

export const MOCK_MENU_ITEMS = [
  {id: 'home', menu_name: 'Home', screen_name: 'Home', menu_icon: 'home', position: 'bottom'},
  {id: 'work', menu_name: 'Work', screen_name: 'Work', menu_icon: 'incident', position: 'bottom'},
  {id: 'maintenance', menu_name: 'Maintenance', screen_name: 'Maintenance', menu_icon: 'maintenance', position: 'bottom'},
  {id: 'fixture', menu_name: 'Fixture', screen_name: 'Fixture', menu_icon: 'fixture', position: 'bottom'},
  {id: 'profile', menu_name: 'Profile', screen_name: 'Profile', menu_icon: 'profile', position: 'more'},
  {id: 'incidents', menu_name: 'Incidents', screen_name: 'Incidents', menu_icon: 'incident', position: 'more'},
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
  {id: 'p5', name: 'Five Points BID', address: 'Welton Street · Denver, CO'},
  {id: 'p6', name: 'LoHi District', address: '32nd Avenue · Denver, CO'},
  {id: 'p7', name: 'South Broadway BID', address: 'S Broadway · Denver, CO'},
  {id: 'p8', name: 'Union Station District', address: 'Wynkoop Street · Denver, CO'},
];

export const MOCK_QUICK_ACTIONS = [
  {id: 'qa1', label: 'Add Graffiti', tint: '#DCEBFF'},
  {id: 'qa2', label: 'Add Elevator Check', tint: '#FBE3D6'},
  {id: 'qa3', label: 'Add Litter Pickup', tint: '#FBEFD1'},
  {id: 'qa4', label: 'Add Inspection', tint: '#E2E7F5'},
];

const ADDRESS = 'Rue Des Hauteurs, Val-David, Quebec J0T 2N0, Canada';

export const MOCK_WORK_ITEMS = [
  {
    id: '#96211407',
    category: 'Maintenance',
    status: 'Open',
    date: 'February 21, 2026, 10:05 AM',
    type: 'Alley Cleaning',
    priority: 'High',
    assignee: 'Tom Lee',
    assigneeInitials: 'TL',
    address: ADDRESS,
    bucket: 'assigned',
  },
  {
    id: '#96211432',
    category: 'Maintenance',
    status: 'In-progress',
    date: 'February 21, 2026, 10:05 AM',
    type: 'Alley Cleaning',
    priority: 'High',
    assignee: 'Tom Lee',
    assigneeInitials: 'TL',
    address: ADDRESS,
    bucket: 'assigned',
  },
  {
    id: '#96218765',
    category: 'Maintenance',
    status: 'Open',
    date: 'February 20, 2026, 4:12 PM',
    type: 'Graffiti Removal',
    priority: 'Medium',
    assignee: 'Ana Cruz',
    assigneeInitials: 'AC',
    address: ADDRESS,
    bucket: 'assigned',
  },
  {
    id: '#96201180',
    category: 'Maintenance',
    status: 'Completed',
    date: 'February 18, 2026, 9:30 AM',
    type: 'Litter Pickup',
    priority: 'Low',
    assignee: 'Tom Lee',
    assigneeInitials: 'TL',
    address: ADDRESS,
    bucket: 'completed',
  },
  {
    id: '#96200914',
    category: 'Maintenance',
    status: 'Completed',
    date: 'February 17, 2026, 2:45 PM',
    type: 'Elevator Check',
    priority: 'Medium',
    assignee: 'Ana Cruz',
    assigneeInitials: 'AC',
    address: ADDRESS,
    bucket: 'completed',
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
