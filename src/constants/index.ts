import type { SearchParams } from '../types';

export const DEFAULT_SEARCH_PARAMS: SearchParams = {
  query: '',
  type: 'image',
  quality: 'medium',
  orientation: 'any',
  platforms: { pexels: true, pixabay: true },
  counts: { pexels: 5, pixabay: 5 },
};

export const PLATFORM_KEYS_CONFIG = [
  { id: 'pexels', label: 'PEXELS_API_KEY', url: 'https://www.pexels.com/api/new/' },
  { id: 'pixabay', label: 'PIXABAY_API_KEY', url: 'https://pixabay.com/api/docs/#api_key' },
] as const;
