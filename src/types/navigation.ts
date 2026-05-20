export interface MenuItem {
  id: string;
  menu_name: string;
  screen_name: string;
  menu_icon: string;
  position: 'bottom' | 'more';
}

export interface NavigationState {
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
}
