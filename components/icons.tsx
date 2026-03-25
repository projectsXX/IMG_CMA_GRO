'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Ruler, 
  Users, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  UserPlus,
  Edit2,
  AlertCircle,
  ChevronRight,
  Factory,
  Eye,
  EyeOff
} from 'lucide-react';

export const Architecture = ({ className }: { className?: string }) => <Factory className={className} />;
export const ErrorIcon = ({ className }: { className?: string }) => <AlertCircle className={className} />;
export const Person = ({ className }: { className?: string }) => <Users className={className} />;
export const Lock = ({ className }: { className?: string }) => <Settings className={className} />;
export const EyeIcon = ({ className }: { className?: string }) => <Eye className={className} />;
export const EyeOffIcon = ({ className }: { className?: string }) => <EyeOff className={className} />;
export const ArrowForward = ({ className }: { className?: string }) => <ChevronRight className={className} />;
