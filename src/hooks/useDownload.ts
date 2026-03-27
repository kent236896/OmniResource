import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { SearchResult } from '../types';
import { api } from '../lib/api';

export interface DownloadTask {
  id: string;          // search result id
  filename: string;
  platform: string;
  type: string;
  status: 'pending' | 'downloading' | 'done' | 'error';
}

export interface SessionMeta {
  sessionId: string;
  sessionQuery: string;
  sessionKeywords: string[];
}

export function useDownload(concurrency: number, onSuccess: () => void) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<DownloadTask[]>([]);

  const updateTask = useCallback((id: string, patch: Partial<DownloadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const downloadItem = useCallback(async (item: SearchResult, session: SessionMeta) => {
    const ext = item.type === 'image' ? '.jpg' : '.mp4';
    const filename = `${item.platform}-${Date.now()}${ext}`;

    setDownloadingIds((prev) => new Set(prev).add(item.id));
    updateTask(item.id, { status: 'downloading', filename });

    try {
      await api.download({
        url: item.url,
        filename,
        platform: item.platform,
        type: item.type,
        previewUrl: item.previewUrl,
        concurrency,
        ...session,
      });
      updateTask(item.id, { status: 'done', filename });
      onSuccess();
    } catch {
      updateTask(item.id, { status: 'error' });
      toast.error(`Failed: ${filename}`);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [concurrency, onSuccess, updateTask]);

  const downloadBatch = useCallback(async (items: SearchResult[], session: SessionMeta) => {
    if (items.length === 0) return;

    // Register all tasks as pending first
    setTasks(items.map((item) => ({
      id: item.id,
      filename: '',
      platform: item.platform,
      type: item.type,
      status: 'pending',
    })));

    await Promise.all(items.map((item) => downloadItem(item, session)));
  }, [downloadItem]);

  const clearTasks = useCallback(() => setTasks([]), []);

  return { downloadingIds, tasks, downloadItem, downloadBatch, clearTasks };
}
