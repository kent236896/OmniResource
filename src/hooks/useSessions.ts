import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { SearchSession } from '../types';
import { api } from '../lib/api';

export function useSessions() {
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = async (id: string) => {
    try {
      await api.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  };

  return { sessions, isLoading, fetchSessions, deleteSession };
}
