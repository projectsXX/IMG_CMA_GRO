import { createClient } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'operator';
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          uid: string;
          name: string;
          email: string;
          password?: string;
          role: UserRole;
          last_seen_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          uid: string;
          name: string;
          email: string;
          password?: string;
          role: UserRole;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          uid?: string;
          name?: string;
          email?: string;
          password?: string;
          role?: UserRole;
          last_seen_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
