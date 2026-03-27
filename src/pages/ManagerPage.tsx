import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Eye, Video, Layers, Loader2, RefreshCw,
  Download, CheckCircle2, MoveRight, Copy, FolderSearch,
  X, Search, Sparkles, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatBytes } from '../lib/utils';
import { api } from '../lib/api';
import { electronWindow } from '../lib/electron';
import type { SearchSession, ResourceItem } from '../types';

interface ManagerPageProps {
  sessions: SearchSession[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteSession: (id: string) => void;
  onDeleteResource: (filename: string) => void;
}

export function ManagerPage({
  sessions, isLoading, onRefresh, onDeleteSession, onDeleteResource,
}: ManagerPageProps) {
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderModal, setFolderModal] = useState<'move' | 'copy' | null>(null);
  const [folderPath, setFolderPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Search & keyword expansion
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [isExpanding, setIsExpanding] = useState(false);
  const [querySelected, setQuerySelected] = useState(true);

  const handleExpandKeywords = async () => {
    if (!searchQuery.trim()) { toast.error('Enter a search query first'); return; }
    setIsExpanding(true);
    try {
      const { keywords } = await api.expandKeywords(searchQuery.trim());
      setExpandedKeywords(keywords);
      setSelectedKeywords(new Set(keywords));
      setQuerySelected(true);
    } catch {
      toast.error('Failed to expand keywords');
    } finally {
      setIsExpanding(false);
    }
  };

  const toggleKeyword = (kw: string) =>
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return next;
    });

  const clearSearch = () => {
    setSearchQuery('');
    setExpandedKeywords([]);
    setSelectedKeywords(new Set());
    setQuerySelected(true);
  };

  // Filter logic: raw query (if selected) + selected expanded keywords (OR)
  const activeTerms = [
    ...(searchQuery.trim() && querySelected ? [searchQuery.trim()] : []),
    ...expandedKeywords.filter((kw) => selectedKeywords.has(kw)),
  ];

  const matchesResourceSearch = (res: ResourceItem) => {
    if (activeTerms.length === 0) return true;
    return activeTerms.some((t) =>
      (res.tags ?? []).some((tag) => tag.toLowerCase().includes(t.toLowerCase())),
    );
  };

  // Map each resource id → its session (for preview display)
  const resourceSessionMap = new Map<string, SearchSession>();
  for (const sess of sessions) {
    for (const res of sess.resources) resourceSessionMap.set(res.id, sess);
  }

  // Middle panel: all resources across all sessions, filtered by search
  const allResources = sessions.flatMap((s) => s.resources);
  const resources = allResources.filter(matchesResourceSearch);
  const allSelected = selectedIds.size === resources.length && resources.length > 0;

  // Left panel: sessions that contain at least one matching resource
  const filteredSessions = sessions.filter((sess) =>
    activeTerms.length === 0 || sess.resources.some(matchesResourceSearch),
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(resources.map((r) => r.id)));

  const handleDeleteResource = async (filename: string) => {
    onDeleteResource(filename);
    if (previewItem?.name === filename) setPreviewItem(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(filename);
      return next;
    });
  };

  const openFolderModal = (mode: 'move' | 'copy') => {
    if (selectedIds.size === 0) { toast.error('Select files first'); return; }
    setFolderPath('');
    setFolderModal(mode);
  };

  const pickFolder = async () => {
    const picked = await electronWindow.pickFolder();
    if (picked) setFolderPath(picked);
  };

  const executeOperation = async () => {
    if (!folderPath.trim()) { toast.error('Please enter a target folder'); return; }
    const filenames = resources
      .filter((r) => selectedIds.has(r.id))
      .map((r) => r.name);

    setIsProcessing(true);
    try {
      if (folderModal === 'move') {
        await api.moveResources(filenames, folderPath.trim());
        toast.success(`Moved ${filenames.length} file(s)`);
        onRefresh();
        setSelectedIds(new Set());
      } else {
        await api.copyResources(filenames, folderPath.trim());
        toast.success(`Copied ${filenames.length} file(s)`);
      }
      setFolderModal(null);
    } catch {
      toast.error(`${folderModal === 'move' ? 'Move' : 'Copy'} failed`);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAssets = sessions.reduce((s, sess) => s + sess.resources.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1400px] mx-auto h-[calc(100vh-160px)] flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 mb-6 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-display font-bold tracking-tight">File Manager</h2>
            <p className="text-[11px] uppercase tracking-widest font-bold opacity-40 mt-2">
              {filteredSessions.length}/{sessions.length} records · {totalAssets} assets
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onRefresh}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-2xl text-[11px] uppercase tracking-widest font-bold shadow-sm hover:shadow-md transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </motion.button>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setQuerySelected(true);
                if (!e.target.value.trim()) { setExpandedKeywords([]); setSelectedKeywords(new Set()); }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleExpandKeywords(); }}
              placeholder="Search sessions and resources..."
              className="w-full bg-white border border-zinc-200 pl-10 pr-10 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleExpandKeywords}
            disabled={isExpanding || !searchQuery.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-[11px] uppercase tracking-widest font-bold disabled:opacity-40 hover:bg-indigo-700 transition-all"
          >
            {isExpanding ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Expand
          </motion.button>
        </div>

        {/* Active search chips: raw query + expanded keywords */}
        <AnimatePresence>
          {(searchQuery.trim() || expandedKeywords.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden"
            >
              {/* Raw query chip — toggleable, placed first */}
              {searchQuery.trim() && (
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setQuerySelected((v) => !v)}
                  className={cn(
                    'px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-all',
                    querySelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300',
                  )}
                >
                  {searchQuery.trim()}
                </motion.button>
              )}
              {/* Expanded keyword chips — toggleable */}
              {expandedKeywords.map((kw) => (
                <motion.button
                  key={kw}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => toggleKeyword(kw)}
                  className={cn(
                    'px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-all',
                    selectedKeywords.has(kw)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300',
                  )}
                >
                  {kw}
                </motion.button>
              ))}
              {expandedKeywords.length > 0 && (
                <span className="self-center text-[9px] uppercase tracking-widest font-bold opacity-30 ml-1">
                  {selectedKeywords.size}/{expandedKeywords.length} expanded
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0 overflow-hidden">

          {/* ── Left: Session list ─────────────────────────────── */}
          <div className="col-span-3 flex flex-col gap-2 overflow-y-auto pr-1">
            {filteredSessions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-30 pt-12">
                <Search size={28} strokeWidth={1.5} />
                <p className="text-[10px] uppercase tracking-widest font-bold text-center">No sessions match</p>
              </div>
            ) : filteredSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={previewItem !== null && resourceSessionMap.get(previewItem.id)?.id === session.id}
                onDelete={onDeleteSession}
              />
            ))}
          </div>

          {/* ── Middle: Thumbnails ─────────────────────────────── */}
          <div className="col-span-5 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold border transition-all',
                    allSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300',
                  )}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ActionButton
                  icon={<MoveRight size={13} />}
                  label="Move"
                  disabled={selectedIds.size === 0}
                  onClick={() => openFolderModal('move')}
                />
                <ActionButton
                  icon={<Copy size={13} />}
                  label="Copy"
                  disabled={selectedIds.size === 0}
                  onClick={() => openFolderModal('copy')}
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto">
              {resources.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-30">
                  <p className="text-[11px] uppercase tracking-widest font-bold">No results</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 pb-2">
                  {resources.map((res) => (
                    <ThumbCard
                      key={res.id}
                      resource={res}
                      isSelected={selectedIds.has(res.id)}
                      isActive={previewItem?.id === res.id}
                      onToggleSelect={toggleSelect}
                      onPreview={setPreviewItem}
                      onDelete={handleDeleteResource}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Preview ─────────────────────────────────── */}
          <div className="col-span-4 bento-card overflow-hidden flex flex-col bg-zinc-100">
            <AnimatePresence mode="wait">
              {previewItem ? (
                <PreviewPane
                  key={previewItem.id}
                  item={previewItem}
                  session={resourceSessionMap.get(previewItem.id) ?? null}
                  onDelete={handleDeleteResource}
                />
              ) : (
                <EmptyPreview />
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Folder picker modal ───────────────────────────────── */}
      <AnimatePresence>
        {folderModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setFolderModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-[480px] space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    {folderModal === 'move' ? <MoveRight size={18} /> : <Copy size={18} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold tracking-tight">
                      {folderModal === 'move' ? 'Move Files' : 'Copy Files'}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                      {selectedIds.size} file(s) selected
                    </p>
                  </div>
                </div>
                <button onClick={() => setFolderModal(null)} className="text-zinc-300 hover:text-zinc-500">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-widest font-bold opacity-50">
                  Target Folder
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="Enter or browse a folder path..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={pickFolder}
                    className="px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-200 transition-all"
                    title="Browse"
                  >
                    <FolderSearch size={16} />
                  </motion.button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setFolderModal(null)}
                  className="flex-1 py-3 bg-zinc-100 rounded-2xl text-[11px] uppercase tracking-widest font-bold text-zinc-500 hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={executeOperation}
                  disabled={isProcessing || !folderPath.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] uppercase tracking-widest font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing
                    ? <Loader2 size={14} className="animate-spin" />
                    : folderModal === 'move' ? <MoveRight size={14} /> : <Copy size={14} />}
                  {folderModal === 'move' ? 'Move Here' : 'Copy Here'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Session Item (left panel) ──────────────────────────────────────────────────

function SessionItem({ session, isActive, onDelete }: {
  session: SearchSession;
  isActive: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'bento-card p-4 group transition-all duration-200 select-none',
        isActive ? 'ring-2 ring-indigo-500 bg-indigo-50/40' : '',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-[12px] font-bold uppercase tracking-wide truncate">{session.query}</p>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold opacity-40">
            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
            <span>·</span>
            <span>{session.resources.length} files</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {session.keywords.slice(0, 4).map((kw) => (
              <span key={kw} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 text-[8px] font-bold uppercase rounded-md">
                {kw}
              </span>
            ))}
            {session.keywords.length > 4 && (
              <span className="text-[8px] opacity-30 font-bold">+{session.keywords.length - 4}</span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
          className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Thumbnail Card (middle panel) ──────────────────────────────────────────────

function ThumbCard({ resource, isSelected, isActive, onToggleSelect, onPreview, onDelete }: {
  resource: ResourceItem;
  isSelected: boolean;
  isActive: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (r: ResourceItem) => void;
  onDelete: (filename: string) => void;
}) {
  return (
    <div
      onClick={() => onPreview(resource)}
      className={cn(
        'relative aspect-square rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200',
        isActive ? 'ring-2 ring-indigo-600' : 'ring-1 ring-zinc-200 hover:ring-zinc-300',
      )}
    >
      {/* Image / Video */}
      {resource.type === 'image' ? (
        <img src={resource.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
          <Video size={24} className="text-white/30" />
        </div>
      )}

      {/* Selection checkbox (top-left) */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleSelect(resource.id); }}
        className="absolute top-2 left-2 z-10"
      >
        <div className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
          isSelected
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'bg-white/70 border-white/70 opacity-0 group-hover:opacity-100',
        )}>
          {isSelected && <CheckCircle2 size={12} />}
        </div>
      </div>

      {/* Selected overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-indigo-600/15 pointer-events-none" />
      )}

      {/* Delete (top-right, on hover) */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(resource.name); }}
        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <Trash2 size={10} />
      </button>

      {/* Type badge (bottom) */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[8px] uppercase tracking-widest font-bold text-white truncate">{resource.name}</p>
      </div>
    </div>
  );
}

// ── Preview Pane (right panel) ─────────────────────────────────────────────────

function PreviewPane({ item, session, onDelete }: {
  item: ResourceItem;
  session: SearchSession | null;
  onDelete: (f: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col"
    >
      {/* Media */}
      <div className="flex-1 min-h-0 relative">
        {item.type === 'image' ? (
          <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
        ) : (
          <video src={item.url} controls autoPlay className="w-full h-full object-contain bg-black" />
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.a
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            href={item.url} download={item.name}
            className="p-3 bg-white/90 backdrop-blur-md text-zinc-900 rounded-xl shadow-lg border border-white/20 hover:bg-white transition-all"
          >
            <Download size={16} />
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(item.name)}
            className="p-3 bg-red-500/90 backdrop-blur-md text-white rounded-xl shadow-lg hover:bg-red-600 transition-all"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>

      <div className="p-5 bg-white border-t border-zinc-200/50 space-y-4 overflow-y-auto">
        {/* File info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-display font-bold tracking-tight truncate flex-1">{item.name}</h3>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-widest rounded-lg flex-shrink-0">
              {item.type}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-bold opacity-40">
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            <span>·</span>
            <span>{formatBytes(item.size)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-green-500" /> OK
            </span>
          </div>
        </div>

        {/* Session info */}
        {session && (
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3 space-y-2">
            <p className="text-[9px] uppercase tracking-widest font-bold opacity-30">Search Session</p>
            <p className="text-[12px] font-bold tracking-tight truncate">{session.query}</p>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold opacity-40">
              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span>{session.resources.length} files</span>
            </div>
            {session.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {session.keywords.map((kw) => (
                  <span key={kw} className="px-1.5 py-0.5 bg-zinc-200 text-zinc-500 text-[8px] font-bold uppercase rounded-md">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] uppercase tracking-widest font-bold opacity-30 flex items-center gap-1">
              <Tag size={9} /> Classification Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase tracking-widest rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Action Button ──────────────────────────────────────────────────────────────

function ActionButton({ icon, label, disabled, onClick }: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold border transition-all',
        disabled
          ? 'bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed'
          : 'bg-white border-zinc-200 text-zinc-600 hover:border-indigo-300 hover:text-indigo-600',
      )}
    >
      {icon} {label}
    </motion.button>
  );
}

// ── Empty States ───────────────────────────────────────────────────────────────

function EmptyPreview() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-25"
    >
      <div className="w-16 h-16 bg-zinc-200 rounded-3xl flex items-center justify-center">
        <Eye size={32} />
      </div>
      <p className="text-[11px] uppercase tracking-widest font-bold">Select a file to preview</p>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 bento-card border-dashed border-zinc-200 flex flex-col items-center justify-center gap-6 opacity-40">
      <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center">
        <Layers size={40} strokeWidth={1.5} className="text-zinc-400" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-[12px] uppercase tracking-widest font-bold">No Records Yet</p>
        <p className="text-[10px] uppercase tracking-widest opacity-60">Search and download assets to create records</p>
      </div>
    </div>
  );
}
