import { motion } from 'framer-motion';
import { Search, Settings, Layers, Download, Info } from 'lucide-react';
const logoUrl = '/img/omni-logo.png';
import { cn } from '../../lib/utils';

type Tab = 'search' | 'manager' | 'settings' | 'about';

const NAV_ITEMS = [
  { id: 'search' as Tab, label: 'Discovery', icon: Search },
  { id: 'manager' as Tab, label: 'File Manager', icon: Layers },
  { id: 'settings' as Tab, label: 'Preferences', icon: Settings },
  { id: 'about' as Tab, label: 'About', icon: Info },
];

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isElectron: boolean;
  concurrency: number;
  systemCpus: number;
  deferredPrompt: any;
  onInstall: () => void;
}

export function Sidebar({
  activeTab, onTabChange, isElectron, concurrency, systemCpus, deferredPrompt, onInstall,
}: SidebarProps) {
  const systemLoad = Math.round((concurrency / (systemCpus * 2)) * 100);

  return (
    <aside className="w-72 glass border-r border-zinc-200/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-8 border-b border-zinc-200/50">
        <div className="flex items-center gap-3 mb-1">
          <img src={logoUrl} alt="OmniResource" className="w-8 h-8 rounded-xl object-contain" />
          <h1 className="text-xl font-display font-bold tracking-tight">OmniResource</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] uppercase tracking-widest opacity-40 font-medium">OmniResource Engine v2.0</p>
          {isElectron && (
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black uppercase tracking-tighter rounded-md border border-indigo-200">
              Desktop Mode
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {NAV_ITEMS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3.5 text-[11px] uppercase tracking-widest transition-all rounded-2xl group',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-500/20'
                : 'opacity-60 hover:opacity-100 hover:bg-zinc-200/50',
            )}
          >
            <tab.icon
              size={16}
              className={cn(activeTab === tab.id ? 'text-white' : 'group-hover:text-indigo-600')}
            />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Footer: Install + System Performance */}
      <div className="p-8 border-t border-zinc-200/50 space-y-6">
        {deferredPrompt && (
          <button
            onClick={onInstall}
            className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-bold rounded-2xl shadow-xl hover:bg-black transition-all"
          >
            <Download size={14} /> Install App
          </button>
        )}
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] uppercase tracking-widest opacity-40 font-bold">
            <span>System Performance</span>
            <span>{systemLoad}%</span>
          </div>
          <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${systemLoad}%` }}
              className="h-full bg-indigo-600"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
