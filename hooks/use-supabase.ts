'use client';

import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';

export function useSupabase() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  return {
    supabase,
    loading,
    error,
  };
}

// Specific hooks for tables
export function useDocuments(userId?: string) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('owner_id', userId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();

    // Subscribe to changes
    const subscription = supabase
      .channel('documents_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents',
        filter: `owner_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDocuments(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setDocuments(prev => prev.map(doc => doc.id === payload.new.id ? payload.new as any : doc));
        } else if (payload.eventType === 'DELETE') {
          setDocuments(prev => prev.filter(doc => doc.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { documents, loading, error };
}
