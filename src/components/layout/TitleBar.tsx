import { useState, useEffect } from 'react';
import { Minus, Maximize2, Minimize2, X } from 'lucide-react';
import { electronWindow } from '../../lib/electron';
import { cn } from '../../lib/utils';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    electronWindow.isMaximized().then(setIsMaximized);
    const cleanup = electronWindow.onMaximizeChange(setIsMaximized);
    return cleanup;
  }, []);

  return (
    <div
      className="flex items-center justify-between h-9 bg-white border-b border-zinc-200/50 select-none flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App name */}
      <span className="px-4 text-[10px] uppercase tracking-widest font-bold opacity-30">
        OmniResource
      </span>

      {/* Window controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <WindowButton
          onClick={electronWindow.minimize}
          label="Minimize"
          hoverClass="hover:bg-zinc-100"
        >
          <Minus size={12} />
        </WindowButton>

        <WindowButton
          onClick={electronWindow.toggleMaximize}
          label={isMaximized ? 'Restore' : 'Maximize'}
          hoverClass="hover:bg-zinc-100"
        >
          {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </WindowButton>

        <WindowButton
          onClick={electronWindow.close}
          label="Close"
          hoverClass="hover:bg-red-500 hover:text-white"
        >
          <X size={12} />
        </WindowButton>
      </div>
    </div>
  );
}

function WindowButton({
  onClick, label, hoverClass, children,
}: {
  onClick: () => void;
  label: string;
  hoverClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'w-12 h-full flex items-center justify-center text-zinc-400 transition-colors duration-150',
        hoverClass,
      )}
    >
      {children}
    </button>
  );
}
