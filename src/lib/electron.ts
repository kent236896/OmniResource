// Safe wrapper around Electron IPC — no-ops when running in browser
const ipc = (window as any)?.require?.('electron')?.ipcRenderer ?? null;

export const electronWindow = {
  minimize: () => ipc?.send('window:minimize'),
  toggleMaximize: () => ipc?.send('window:maximize'),
  close: () => ipc?.send('window:close'),
  isMaximized: (): Promise<boolean> => ipc?.invoke('window:is-maximized') ?? Promise.resolve(false),
  pickFolder: (): Promise<string | null> =>
    ipc?.invoke('dialog:open-folder') ?? Promise.resolve(null),

  onMaximizeChange: (cb: (maximized: boolean) => void) => {
    ipc?.on('window:maximized', () => cb(true));
    ipc?.on('window:unmaximized', () => cb(false));
    return () => {
      ipc?.removeAllListeners('window:maximized');
      ipc?.removeAllListeners('window:unmaximized');
    };
  },
};
