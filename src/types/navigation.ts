export type MenuGroup = 'modules' | 'employee_shift';

export interface MenuItem {
  id: string;
  menu_name: string;
  screen_name: string;
  menu_icon: string;
  position: 'bottom' | 'more';
  /** Section of the More sheet. Unset items fall under 'modules'. */
  menu_group?: MenuGroup;
}

export interface NavigationState {
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
}
