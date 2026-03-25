import { UserRole } from './supabase';

export interface ScreenConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
  allowedRoles: UserRole[];
}

export const SCREENS: ScreenConfig[] = [
  {
    id: 'dashboard',
    label: 'Painel',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    allowedRoles: ['admin', 'manager', 'operator'],
  },
  {
    id: 'users',
    label: 'Usuários',
    path: '/dashboard/users',
    icon: 'Users',
    allowedRoles: ['admin', 'manager'],
  },
  {
    id: 'measurement',
    label: 'Medição',
    path: '/dashboard/measurement',
    icon: 'Ruler',
    allowedRoles: ['admin', 'manager', 'operator'],
  },
  {
    id: 'settings',
    label: 'Configurações',
    path: '/dashboard/settings',
    icon: 'Settings',
    allowedRoles: ['admin'],
  },
];

export function canAccessScreen(role: UserRole, path: string): boolean {
  const screen = SCREENS.find(s => s.path === path);
  if (!screen) return true; // Public or unknown screens
  return screen.allowedRoles.includes(role);
}

export function getAllowedScreens(role: UserRole): ScreenConfig[] {
  return SCREENS.filter(s => s.allowedRoles.includes(role));
}
