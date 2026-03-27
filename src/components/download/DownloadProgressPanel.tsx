import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle2, XCircle, Loader2, X, Image as ImageIcon, Video } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DownloadTask } from '../../hooks/useDownload';

interface DownloadProgressPanelProps {
  tasks: DownloadTask[];
  onClose: () => void;
}

export function DownloadProgressPanel({ tasks, onClose }: DownloadProgressPanelProps) {
  const visible = tasks.length > 0;

  const done = tasks.filter((t) => t.status === 'done').length;
  const errors = tasks.filter((t) => t.status === 'error').length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round(((done + errors) / total) * 100) : 0;
  const allFinished = total > 0 && done + errors === total;

  // Auto-close 3 s after all finished
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (allFinished) {
      timerRef.current = setTimeout(onClose, 3000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [allFinished, onClose]);

  // Category breakdown
  const byPlatform = groupBy(tasks, 'platform');
  const byType = groupBy(tasks, 'type');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="fixed bottom-14 right-6 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-zinc-200/60 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              {allFinished ? (
                errors === 0
                  ? <CheckCircle2 size={16} className="text-green-500" />
                  : <XCircle size={16} className="text-amber-500" />
              ) : (
                <Loader2 size={16} className="text-indigo-600 animate-spin" />
              )}
              <span className="text-[11px] uppercase tracking-widest font-bold text-zinc-800">
                {allFinished ? (errors === 0 ? 'All Downloaded' : `Done with ${errors} errors`) : 'Downloading...'}
              </span>
            </div>
            <button onClick={onClose} className="text-zinc-300 hover:text-zinc-500 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Overall progress bar */}
          <div className="px-5 pb-4 space-y-1.5">
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', errors > 0 && allFinished ? 'bg-amber-400' : 'bg-indigo-500')}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold opacity-40">
              <span>{done} done{errors > 0 ? ` · ${errors} failed` : ''}</span>
              <span>{progress}% · {total} total</span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="border-t border-zinc-100 px-5 py-4 space-y-4">
            {/* By type */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest font-bold opacity-30">By Type</p>
              {Object.entries(byType).map(([type, list]) => (
                <CategoryRow
                  key={type}
                  icon={type === 'image'
                    ? <ImageIcon size={12} className="text-indigo-500" />
                    : <Video size={12} className="text-violet-500" />}
                  label={type}
                  tasks={list}
                />
              ))}
            </div>

            {/* By platform */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest font-bold opacity-30">By Platform</p>
              {Object.entries(byPlatform).map(([platform, list]) => (
                <CategoryRow
                  key={platform}
                  icon={<Download size={12} className="text-zinc-400" />}
                  label={platform}
                  tasks={list}
                />
              ))}
            </div>
          </div>

          {/* Task list (scrollable) */}
          <div className="border-t border-zinc-100 max-h-40 overflow-y-auto">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Category Row ───────────────────────────────────────────────────────────────

function CategoryRow({ icon, label, tasks }: {
  icon: React.ReactNode;
  label: string;
  tasks: DownloadTask[];
}) {
  const done = tasks.filter((t) => t.status === 'done').length;
  const errors = tasks.filter((t) => t.status === 'error').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round(((done + errors) / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-4 flex justify-center">{icon}</div>
      <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 w-16 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', errors > 0 ? 'bg-amber-400' : 'bg-indigo-400')}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <span className="text-[9px] font-mono font-bold opacity-30 w-8 text-right">{done}/{total}</span>
    </div>
  );
}

// ── Task Row ───────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: DownloadTask }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-50 transition-colors">
      <StatusDot status={task.status} />
      <span className="text-[10px] font-mono opacity-50 truncate flex-1">
        {task.filename || `${task.platform} · pending`}
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: DownloadTask['status'] }) {
  if (status === 'done') return <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />;
  if (status === 'error') return <XCircle size={12} className="text-red-400 flex-shrink-0" />;
  if (status === 'downloading') return <Loader2 size={12} className="text-indigo-500 animate-spin flex-shrink-0" />;
  return <div className="w-3 h-3 rounded-full border-2 border-zinc-200 flex-shrink-0" />;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupBy<T extends Record<string, any>>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
