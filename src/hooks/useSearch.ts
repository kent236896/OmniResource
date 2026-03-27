import { useState } from 'react';
import { toast } from 'sonner';
import type { SearchParams, SearchResult } from '../types';
import { api, runSearch } from '../lib/api';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useSearch(params: SearchParams) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [isExpandingKeywords, setIsExpandingKeywords] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const expandKeywords = async () => {
    if (!params.query) return;
    setIsExpandingKeywords(true);
    try {
      const { keywords: kws } = await api.expandKeywords(params.query);
      // Prepend the original query as the first keyword
      const all = [params.query, ...kws.filter((k) => k !== params.query)];
      setKeywords(all);
      setSelectedKeywords(new Set(all)); // default: all selected
    } catch {
      toast.error('Failed to expand keywords');
    } finally {
      setIsExpandingKeywords(false);
    }
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return next;
    });
  };

  const search = async () => {
    const active = keywords.filter((kw) => selectedKeywords.has(kw));
    if (active.length === 0) {
      toast.error('Please select at least one keyword');
      return;
    }
    const id = generateId();
    setSessionId(id);
    setIsSearching(true);
    setResults([]);
    try {
      const data = await runSearch(params, active);
      setResults(data);
      if (data.length === 0) toast.info('No results found. Ensure your API keys are set.');
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return {
    keywords, setKeywords,
    selectedKeywords, toggleKeyword,
    isExpandingKeywords,
    results, isSearching,
    sessionId,
    expandKeywords, search,
  };
}
