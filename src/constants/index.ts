export const SESSION_TOKEN_KEY = '@auth_token';
export const SESSION_USER_KEY = '@auth_user';

export const MOCK_MENU_ITEMS = [
  {id: 'home', menu_name: 'Home', screen_name: 'Home', menu_icon: 'home', position: 'bottom'},
  {id: 'maintenance', menu_name: 'Maintenance', screen_name: 'Maintenance', menu_icon: 'maintenance', position: 'bottom'},
  {id: 'fixture', menu_name: 'Fixture', screen_name: 'Fixture', menu_icon: 'fixture', position: 'bottom'},
  {id: 'incident', menu_name: 'Incident', screen_name: 'Incident', menu_icon: 'incident', position: 'bottom'},
  {id: 'profile', menu_name: 'Profile', screen_name: 'Profile', menu_icon: 'profile', position: 'more'},
];

export const MOCK_PROGRAMS = [
  {id: '1', program_name: '55300 Test Program', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '2', program_name: 'Akron OH Downtown Akron Part', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '3', program_name: 'Akron OH University of Akron 5300', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: false, civicity: false},
  {id: '4', program_name: 'Albuquerque NM Downtown 3300', timezone_str: 'America/Denver', time_zone: -7, shift_enabled: true, civicity: false},
  {id: '5', program_name: 'Albuquerque NM Nob Hill 3300', timezone_str: 'America/Denver', time_zone: -7, shift_enabled: true, civicity: false},
  {id: '6', program_name: 'Albuquerque NM Route 66 & Co', timezone_str: 'America/Denver', time_zone: -7, shift_enabled: false, civicity: false},
  {id: '7', program_name: 'Albuquerque NM Uptown 3300', timezone_str: 'America/Denver', time_zone: -7, shift_enabled: true, civicity: false},
  {id: '8', program_name: 'Arlington TX Downtown Arlington', timezone_str: 'America/Chicago', time_zone: -6, shift_enabled: true, civicity: false},
  {id: '9', program_name: 'Arlington VA Rosslyn BID 4100', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '10', program_name: 'Atlanta GA Buckhead 2200', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '11', program_name: 'Atlanta GA Downtown 1100', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: true},
  {id: '12', program_name: 'Austin TX 6th Street 5500', timezone_str: 'America/Chicago', time_zone: -6, shift_enabled: true, civicity: false},
  {id: '13', program_name: 'Baltimore MD Downtown 3300', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: false, civicity: false},
  {id: '14', program_name: 'Boston MA Back Bay 4400', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '15', program_name: 'Charlotte NC Uptown 2200', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '16', program_name: 'Chicago IL Loop 1100', timezone_str: 'America/Chicago', time_zone: -6, shift_enabled: true, civicity: true},
  {id: '17', program_name: 'Denver CO Downtown 3300', timezone_str: 'America/Denver', time_zone: -7, shift_enabled: true, civicity: false},
  {id: '18', program_name: 'Louisville KY Training BBB 0000', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: false, civicity: false},
  {id: '19', program_name: 'Miami FL Brickell 5500', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '20', program_name: 'Nashville TN Broadway 4400', timezone_str: 'America/Chicago', time_zone: -6, shift_enabled: true, civicity: false},
  {id: '21', program_name: 'New York NY Midtown 1100', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: true},
  {id: '22', program_name: 'Philadelphia PA Center City 2200', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
  {id: '23', program_name: 'Phoenix AZ Downtown 3300', timezone_str: 'America/Phoenix', time_zone: -7, shift_enabled: true, civicity: false},
  {id: '24', program_name: 'Portland OR Pearl District 4400', timezone_str: 'America/Los_Angeles', time_zone: -8, shift_enabled: false, civicity: false},
  {id: '25', program_name: 'San Diego CA Gaslamp 5500', timezone_str: 'America/Los_Angeles', time_zone: -8, shift_enabled: true, civicity: false},
  {id: '26', program_name: 'San Francisco CA Union Square 1100', timezone_str: 'America/Los_Angeles', time_zone: -8, shift_enabled: true, civicity: true},
  {id: '27', program_name: 'Seattle WA Downtown 2200', timezone_str: 'America/Los_Angeles', time_zone: -8, shift_enabled: true, civicity: false},
  {id: '28', program_name: 'Tampa FL Ybor City 3300', timezone_str: 'America/New_York', time_zone: -5, shift_enabled: true, civicity: false},
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
