import { Cpu, Layers } from 'lucide-react';

interface StatusBarProps {
  systemCpus: number;
  resourceCount: number;
}

export function StatusBar({ systemCpus, resourceCount }: StatusBarProps) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <footer className="h-10 border-t border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
          <span className="text-zinc-900">System Operational</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <div className="flex items-center gap-2.5">
          <Cpu size={12} className="text-indigo-600" />
          <span>{systemCpus} Core Architecture</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <div className="flex items-center gap-2.5">
          <Layers size={12} className="text-indigo-600" />
          <span>{resourceCount} Assets Indexed</span>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <span className="text-zinc-400">{time}</span>
        <div className="h-4 w-px bg-zinc-200" />
        <span className="text-indigo-600">OmniResource Engine v2.0</span>
      </div>
    </footer>
  );
}
