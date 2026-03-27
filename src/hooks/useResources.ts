import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { ResourceItem } from '../types';
import { api } from '../lib/api';

export function useResources(tagFilter: string) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getResources(tagFilter || undefined);
      setResources(data);
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  }, [tagFilter]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const deleteResource = async (filename: string) => {
    try {
      await api.deleteResource(filename);
      setResources((prev) => prev.filter((r) => r.name !== filename));
      toast.success('Resource deleted');
      return true;
    } catch {
      toast.error('Failed to delete resource');
      return false;
    }
  };

  return { resources, isLoading, fetchResources, deleteResource };
}
