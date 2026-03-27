import type { ResourceItem, SearchResult, SearchParams, SearchSession } from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export const api = {
  getSystemInfo: () =>
    request<{ cpus: number; envStatus: Record<string, boolean> }>('/api/system-info'),

  expandKeywords: (query: string) =>
    request<{ keywords: string[] }>('/api/keywords/expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    }),

  search: (params: {
    platform: string;
    keyword: string;
    type: string;
    orientation: string;
    count: number;
  }) =>
    request<SearchResult[]>('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),

  getResources: (tag?: string) => {
    const url = tag ? `/api/resources?tag=${encodeURIComponent(tag)}` : '/api/resources';
    return request<ResourceItem[]>(url);
  },

  deleteResource: (filename: string) =>
    request<{ success: boolean }>(`/api/resources/${filename}`, { method: 'DELETE' }),

  moveResources: (filenames: string[], targetDir: string) =>
    request<{ success: boolean }>('/api/resources/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filenames, targetDir }),
    }),

  copyResources: (filenames: string[], targetDir: string) =>
    request<{ success: boolean }>('/api/resources/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filenames, targetDir }),
    }),

  getSessions: () => request<SearchSession[]>('/api/sessions'),

  deleteSession: (id: string) =>
    request<{ success: boolean }>(`/api/sessions/${id}`, { method: 'DELETE' }),

  getApiKeys: () => request<Record<string, string>>('/api/settings/keys'),

  saveApiKeys: (keys: Record<string, string>) =>
    request<{ success: boolean }>('/api/settings/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys),
    }),

  getDownloadPath: () => request<{ path: string }>('/api/settings/download-path'),

  saveDownloadPath: (dirPath: string) =>
    request<{ success: boolean }>('/api/settings/download-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath }),
    }),

  download: (params: {
    url: string;
    filename: string;
    platform: string;
    type: string;
    previewUrl: string;
    concurrency: number;
    sessionId: string;
    sessionQuery: string;
    sessionKeywords: string[];
  }) =>
    request<{ success: boolean; filename: string }>('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
};

export async function runSearch(params: SearchParams, keywords: string[]): Promise<SearchResult[]> {
  const platforms = (Object.entries(params.platforms) as [string, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([p]) => p);

  const results: SearchResult[] = [];
  for (const keyword of keywords) {
    for (const platform of platforms) {
      try {
        const data = await api.search({
          platform, keyword,
          type: params.type,
          orientation: params.orientation,
          count: params.counts[platform as keyof typeof params.counts],
        });
        results.push(...data);
      } catch (e) {
        console.warn(`Search failed for ${platform}/${keyword}:`, e);
      }
    }
  }
  return results;
}
