export type ResourceType = 'image' | 'video';
export type Quality = 'low' | 'medium' | 'high';
export type Orientation = 'any' | 'landscape' | 'portrait';

export interface ApiKeys {
  pexels: string;
  pixabay: string;
  openai: string;
  deepseek: string;
  openrouter: string;
}

export interface SearchParams {
  query: string;
  type: ResourceType;
  quality: Quality;
  orientation: Orientation;
  platforms: {
    pexels: boolean;
    pixabay: boolean;
  };
  counts: {
    pexels: number;
    pixabay: number;
  };
}

export interface ResourceItem {
  id: string;
  name: string;
  type: ResourceType;
  size: number;
  createdAt: string;
  url: string;
  tags?: string[];
}

export interface SearchSession {
  id: string;
  query: string;
  keywords: string[];
  createdAt: string;
  resources: ResourceItem[];
}

export interface SearchResult {
  id: string;
  url: string;
  previewUrl: string;
  platform: 'pexels' | 'pixabay';
  type: ResourceType;
  width?: number;
  height?: number;
}
