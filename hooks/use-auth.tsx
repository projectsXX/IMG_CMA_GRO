'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, UserRole } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isAuthReady: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching role for user:', userId);
      
      // Update last_seen_at
      await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('uid', userId);

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('uid', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role from DB:', error);
        // Fail-safe for master admin
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session user email:', session?.user?.email);
        if (session?.user?.email === 'admin@cmagro.com') {
          console.log('Fail-safe triggered: Setting role to admin');
          setRole('admin');
        } else {
          console.log('Fail-safe triggered: Setting role to operator');
          setRole('operator');
        }
      } else {
        console.log('Role found in DB:', data.role);
        // Even if DB says something else, master admin email is always admin
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === 'admin@cmagro.com') {
          console.log('Master admin override: Setting role to admin');
          setRole('admin');
        } else {
          setRole(data.role as UserRole);
        }
      }
    } catch (err) {
      console.error('Auth fetch role error:', err);
      setRole('operator');
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserRole(currentUser.id).finally(() => {
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserRole(currentUser.id).finally(() => {
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        setRole(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
