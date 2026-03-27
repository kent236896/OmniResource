import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Image as ImageIcon, Video, Cpu,
  Loader2, RefreshCw, CheckCircle2, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { SearchParams, SearchResult, ResourceType, Quality, Orientation } from '../types';

interface DiscoveryPageProps {
  searchParams: SearchParams;
  onSearchParamsChange: (p: SearchParams) => void;
  keywords: string[];
  selectedKeywords: Set<string>;
  onToggleKeyword: (kw: string) => void;
  onClearKeywords: () => void;
  isExpandingKeywords: boolean;
  onExpandKeywords: () => void;
  results: SearchResult[];
  isSearching: boolean;
  onSearch: () => void;
  downloadingIds: Set<string>;
  onDownload: (item: SearchResult) => void;
  onDownloadBatch: (items: SearchResult[]) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  concurrency: number;
  onConcurrencyChange: (n: number) => void;
  systemCpus: number;
  envStatus: Record<string, boolean>;
  onGoToSettings: () => void;
}

export function DiscoveryPage({
  searchParams, onSearchParamsChange,
  keywords, selectedKeywords, onToggleKeyword, onClearKeywords, isExpandingKeywords, onExpandKeywords,
  results, isSearching, onSearch,
  downloadingIds, onDownload, onDownloadBatch,
  selectedIds, onToggleSelect, onSelectAll,
  concurrency, onConcurrencyChange, systemCpus,
  envStatus, onGoToSettings,
}: DiscoveryPageProps) {
  const selectedItems = results.filter((r) => selectedIds.has(r.id));
  const allSelected = selectedIds.size === results.length && results.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10"
    >
      {/* Left Column */}
      <div className="lg:col-span-4 space-y-8">
        {/* Keyword Expansion */}
        <section className="bento-card p-8 space-y-6">
          <div className="flex justify-between items-center">
            <label className="text-[11px] uppercase tracking-widest font-bold text-indigo-600">Keyword Expansion</label>
            <span className="text-[10px] font-mono opacity-30">{searchParams.query.length}/500</span>
          </div>
          <div className="relative group">
            <textarea
              value={searchParams.query}
              onChange={(e) => onSearchParamsChange({ ...searchParams, query: e.target.value })}
              placeholder="Describe the asset you're looking for..."
              className="w-full bg-zinc-50 border border-zinc-200 p-5 rounded-2xl min-h-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:opacity-30 text-sm leading-relaxed"
            />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onExpandKeywords}
              disabled={isExpandingKeywords || !searchParams.query}
              className="absolute bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-xl disabled:opacity-20 transition-all shadow-lg shadow-indigo-500/30"
            >
              {isExpandingKeywords ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            </motion.button>
          </div>
        </section>

        {/* Keywords List */}
        <AnimatePresence>
          {keywords.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bento-card p-8 space-y-6 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <label className="text-[11px] uppercase tracking-widest font-bold text-indigo-600">
                  Keywords
                  <span className="ml-2 opacity-40">({selectedKeywords.size}/{keywords.length})</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => keywords.forEach((kw) => !selectedKeywords.has(kw) && onToggleKeyword(kw))}
                    className="text-[10px] uppercase font-bold opacity-40 hover:opacity-100 transition-opacity"
                  >
                    All
                  </button>
                  <button onClick={onClearKeywords} className="text-[10px] uppercase font-bold opacity-40 hover:opacity-100 transition-opacity">Clear</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => {
                  const active = selectedKeywords.has(kw);
                  return (
                    <motion.button
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => onToggleKeyword(kw)}
                      className={cn(
                        'px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all duration-200',
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30'
                          : 'bg-zinc-100 text-zinc-400 border-zinc-200/50 hover:border-zinc-300',
                      )}
                    >
                      {kw}
                    </motion.button>
                  );
                })}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onSearch}
                disabled={isSearching}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl text-[11px] uppercase tracking-widest font-bold hover:bg-black transition-all flex justify-center items-center gap-3 shadow-xl"
              >
                {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                Execute Search
              </motion.button>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Filters */}
        <section className="bento-card p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold opacity-50">Media Type</label>
              <select
                value={searchParams.type}
                onChange={(e) => onSearchParamsChange({ ...searchParams, type: e.target.value as ResourceType })}
                className="w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="image">Still Images</option>
                <option value="video">Motion Video</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold opacity-50">Quality</label>
              <select
                value={searchParams.quality}
                onChange={(e) => onSearchParamsChange({ ...searchParams, quality: e.target.value as Quality })}
                className="w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="low">Standard</option>
                <option value="medium">High Definition</option>
                <option value="high">Ultra High (4K)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-widest font-bold opacity-50">Orientation</label>
            <select
              value={searchParams.orientation}
              onChange={(e) => onSearchParamsChange({ ...searchParams, orientation: e.target.value as Orientation })}
              className="w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="any">Any Orientation</option>
              <option value="landscape">Landscape (Horizontal)</option>
              <option value="portrait">Portrait (Vertical)</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] uppercase tracking-widest font-bold opacity-50">Platform Filters</label>
            <div className="space-y-3 bg-zinc-50 p-5 rounded-2xl border border-zinc-200/50">
              {(Object.keys(searchParams.platforms) as Array<keyof typeof searchParams.platforms>).map((platform) => {
                const hasKey = !!envStatus[platform];
                return (
                  <div key={platform} className="space-y-1.5">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={searchParams.platforms[platform]}
                          disabled={!hasKey}
                          onChange={(e) => onSearchParamsChange({
                            ...searchParams,
                            platforms: { ...searchParams.platforms, [platform]: e.target.checked },
                          })}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer rounded disabled:cursor-not-allowed disabled:opacity-30"
                        />
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-[11px] uppercase font-bold tracking-wider transition-opacity',
                            hasKey ? 'opacity-60 group-hover:opacity-100' : 'opacity-30',
                          )}>
                            {platform}
                          </span>
                          <div className={cn(
                            'w-1.5 h-1.5 rounded-full flex-shrink-0',
                            hasKey ? 'bg-green-500' : 'bg-amber-400',
                          )} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold opacity-30">LIMIT:</span>
                        <input
                          type="number" min="1" max="50"
                          value={searchParams.counts[platform]}
                          disabled={!hasKey}
                          onChange={(e) => onSearchParamsChange({
                            ...searchParams,
                            counts: { ...searchParams.counts, [platform]: parseInt(e.target.value) || 1 },
                          })}
                          className="w-10 bg-transparent border-b border-zinc-300 text-center text-[11px] font-bold focus:outline-none focus:border-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {!hasKey && (
                      <button
                        onClick={onGoToSettings}
                        className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-amber-500 hover:text-amber-600 transition-colors ml-7"
                      >
                        <AlertTriangle size={10} />
                        API key missing — click to configure
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Results */}
      <div className="lg:col-span-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-display font-bold tracking-tight">Search Results</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-[11px] uppercase tracking-widest font-bold opacity-40">
                {results.length > 0 ? `Found ${results.length} premium assets` : 'Ready for new query'}
              </p>
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                  <button onClick={onSelectAll} className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 hover:underline">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => onDownloadBatch(selectedItems)}
                className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
              >
                <Download size={14} /> Download Selected ({selectedIds.size})
              </motion.button>
            )}
            <div className="glass p-4 rounded-2xl border border-zinc-200/50 flex items-center gap-3">
              <Cpu size={16} className="text-indigo-600" />
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Threads:</span>
              <input
                type="number" min="1" max={systemCpus * 2}
                value={concurrency}
                onChange={(e) => onConcurrencyChange(parseInt(e.target.value) || 1)}
                className="w-10 bg-transparent border-b border-zinc-300 text-center text-[11px] font-bold focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {isSearching ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-8">
            <div className="relative">
              <Loader2 className="animate-spin text-indigo-600" size={64} />
              <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse rounded-full" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[11px] uppercase tracking-widest font-bold animate-pulse">Scanning Global Repositories</p>
              <p className="text-[10px] uppercase tracking-widest opacity-40">Orchestrating {concurrency} concurrent threads</p>
            </div>
          </div>
        ) : results.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {results.map((item, i) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  index={i}
                  isSelected={selectedIds.has(item.id)}
                  isDownloading={downloadingIds.has(item.id)}
                  onToggleSelect={onToggleSelect}
                  onDownload={onDownload}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="h-[60vh] bento-card border-dashed border-zinc-200 flex flex-col items-center justify-center gap-8 opacity-40">
            <div className="w-24 h-24 bg-zinc-100 rounded-3xl flex items-center justify-center">
              <ImageIcon size={48} strokeWidth={1.5} className="text-zinc-400" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[12px] uppercase tracking-widest font-bold">Workspace Ready</p>
              <p className="text-[10px] uppercase tracking-widest opacity-60">Generate keywords to begin asset discovery</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────────

interface ResultCardProps {
  item: SearchResult;
  index: number;
  isSelected: boolean;
  isDownloading: boolean;
  onToggleSelect: (id: string) => void;
  onDownload: (item: SearchResult) => void;
}

function ResultCard({ item, index, isSelected, isDownloading, onToggleSelect, onDownload }: ResultCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.02 }}
      className="group bento-card overflow-hidden flex flex-col"
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-zinc-100">
        <img
          src={item.previewUrl}
          alt=""
          className={cn(
            'w-full h-full object-cover transition-transform duration-700 group-hover:scale-110',
            isSelected && 'scale-105 opacity-50',
          )}
          referrerPolicy="no-referrer"
        />

        {/* Selection overlay */}
        <div
          onClick={() => onToggleSelect(item.id)}
          className={cn(
            'absolute inset-0 cursor-pointer transition-all duration-300',
            isSelected ? 'bg-indigo-600/20' : 'hover:bg-black/5',
          )}
        >
          <div className="absolute top-4 right-4">
            <div className={cn(
              'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
              isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/50 border-white/50',
            )}>
              {isSelected && <CheckCircle2 size={14} />}
            </div>
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDownload(item); }}
            disabled={isDownloading}
            className="bg-white text-indigo-600 p-5 rounded-2xl shadow-2xl disabled:opacity-50 pointer-events-auto"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            href={item.url} target="_blank" rel="noopener noreferrer"
            className="bg-white text-zinc-900 p-5 rounded-2xl shadow-2xl pointer-events-auto"
          >
            <ExternalLink size={24} />
          </motion.a>
        </div>

        {/* Platform badge */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[9px] font-bold uppercase tracking-widest rounded-lg shadow-sm border border-white/20">
            {item.platform}
          </span>
        </div>
        {item.type === 'video' && (
          <div className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur-md text-white px-2 py-1 text-[9px] uppercase tracking-widest font-bold rounded-md flex items-center gap-1 pointer-events-none">
            <Video size={10} /> Motion
          </div>
        )}
      </div>
      <div className="p-5 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          {item.type === 'image' ? <ImageIcon size={14} className="text-indigo-600" /> : <Video size={14} className="text-indigo-600" />}
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">{item.type}</span>
        </div>
        {item.width && item.height && (
          <span className="text-[10px] font-mono opacity-30">{item.width}×{item.height}</span>
        )}
      </div>
    </motion.div>
  );
}
