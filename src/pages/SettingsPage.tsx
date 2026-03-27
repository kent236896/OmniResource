import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, ExternalLink, Eye, EyeOff, Save, Loader2, FolderOpen, FolderSearch } from 'lucide-react';
import { electronWindow } from '../lib/electron';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { PLATFORM_KEYS_CONFIG } from '../constants';

const ALL_KEYS = [...PLATFORM_KEYS_CONFIG] as const;

interface SettingsPageProps {
  envStatus: Record<string, boolean>;
  onEnvStatusChange: (status: Record<string, boolean>) => void;
}

export function SettingsPage({ envStatus, onEnvStatusChange }: SettingsPageProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const [isSavingPath, setIsSavingPath] = useState(false);

  useEffect(() => {
    api.getApiKeys()
      .then((data) => setValues(data))
      .catch(() => toast.error('Failed to load saved keys'));
    api.getDownloadPath()
      .then((data) => setDownloadPath(data.path))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.saveApiKeys(values);
      toast.success('API keys saved');
      // Refresh system info to update status indicators
      const info = await fetch('/api/system-info').then((r) => r.json());
      onEnvStatusChange(info.envStatus);
    } catch {
      toast.error('Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePath = async () => {
    if (!downloadPath.trim()) return;
    setIsSavingPath(true);
    try {
      await api.saveDownloadPath(downloadPath.trim());
      toast.success('Download path saved');
    } catch {
      toast.error('Failed to save download path');
    } finally {
      setIsSavingPath(false);
    }
  };

  const toggleVisible = (key: string) =>
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-16 py-12"
    >
      <section className="space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-display font-bold tracking-tight">Security Vault</h3>
              <p className="text-[11px] uppercase tracking-widest font-bold opacity-40 mt-1">
                Environment-level API authentication
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-[11px] uppercase tracking-widest font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Keys
          </motion.button>
        </div>

        {/* Key input card */}
        <div className="bg-zinc-900 text-white p-10 rounded-[32px] space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="space-y-3 relative">
            <p className="text-lg font-display italic leading-relaxed opacity-80">
              "Keys are stored locally in the encrypted database and applied to the server immediately."
            </p>
            <div className="h-1 w-12 bg-indigo-500 rounded-full" />
          </div>

          <div className="space-y-4 relative">
            {ALL_KEYS.map((key) => (
              <KeyRow
                key={key.id}
                keyId={key.id}
                label={key.label}
                url={key.url}
                value={values[key.label] ?? ''}
                isActive={!!envStatus[key.id]}
                isVisible={!!visible[key.label]}
                onChange={(v) => setValues((prev) => ({ ...prev, [key.label]: v }))}
                onToggleVisible={() => toggleVisible(key.label)}
              />
            ))}
          </div>
        </div>

        {/* Deployment instructions */}
        <div className="p-10 bento-card border-dashed border-zinc-200 bg-zinc-50/50">
          <h4 className="text-[11px] uppercase tracking-[0.2em] font-black mb-8 flex items-center gap-3 text-indigo-600">
            <AlertCircle size={18} /> How it works
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              'Enter your API key in the input field next to each provider.',
              'Click <strong class="text-zinc-900">Save Keys</strong> — keys are stored in the local database.',
              'Keys are applied to the server immediately without a restart.',
              'Status indicators turn green once a valid key is detected.',
            ].map((text, i) => (
              <div key={i} className="flex gap-6">
                <span className="text-3xl font-display font-bold opacity-10">{String(i + 1).padStart(2, '0')}</span>
                <p
                  className="text-[11px] leading-relaxed opacity-60 uppercase tracking-widest font-bold"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Path */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <FolderOpen size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-display font-bold tracking-tight">Download Path</h3>
              <p className="text-[11px] uppercase tracking-widest font-bold opacity-40 mt-1">
                Where downloaded assets are stored
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSavePath}
            disabled={isSavingPath}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-[11px] uppercase tracking-widest font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isSavingPath ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Path
          </motion.button>
        </div>
        <div className="bento-card p-8 space-y-4">
          <label className="text-[11px] uppercase tracking-widest font-bold opacity-50">
            Download Directory
          </label>
          <div className="flex items-center gap-3">
            <FolderOpen size={16} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={downloadPath}
              onChange={(e) => setDownloadPath(e.target.value)}
              placeholder="Leave empty to use default (./downloads)"
              className="flex-1 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
            />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={async () => {
                const picked = await electronWindow.pickFolder();
                if (picked) setDownloadPath(picked);
              }}
              title="Browse folder"
              className="flex items-center gap-2 px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-[11px] uppercase tracking-widest font-bold text-zinc-600 hover:bg-zinc-200 hover:border-zinc-300 transition-all flex-shrink-0"
            >
              <FolderSearch size={15} />
              Browse
            </motion.button>
          </div>
          <p className="text-[10px] uppercase tracking-widest opacity-30 font-bold">
            Enter an absolute path, e.g. C:\Users\you\Downloads\OmniResource
          </p>
        </div>
      </section>
    </motion.div>
  );
}

// ── Key Row ────────────────────────────────────────────────────────────────────

interface KeyRowProps {
  keyId: string;
  label: string;
  url: string;
  value: string;
  isActive: boolean;
  isVisible: boolean;
  onChange: (v: string) => void;
  onToggleVisible: () => void;
}

function KeyRow({ label, url, value, isActive, isVisible, onChange, onToggleVisible }: KeyRowProps) {
  return (
    <div className="group border-b border-white/5 pb-5 last:border-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full transition-all duration-500 flex-shrink-0',
            isActive
              ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]'
              : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]',
          )} />
          <span className="text-[12px] font-mono tracking-wider font-bold opacity-70">{label}</span>
        </div>
        <motion.a
          whileHover={{ x: 5 }}
          href={url} target="_blank" rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 hover:text-indigo-400 transition-all flex items-center gap-1.5"
        >
          Get key <ExternalLink size={11} />
        </motion.a>
      </div>
      <div className="relative flex items-center gap-2">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your API key here..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[12px] font-mono text-white placeholder:opacity-20 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
        />
        <button
          onClick={onToggleVisible}
          className="p-3 text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
          title={isVisible ? 'Hide' : 'Show'}
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
