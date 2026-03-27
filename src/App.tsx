import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';

import { DEFAULT_SEARCH_PARAMS } from './constants';
import type { SearchParams } from './types';

import { useSystemInfo } from './hooks/useSystemInfo';
import { useSearch } from './hooks/useSearch';
import { useDownload } from './hooks/useDownload';
import { useSessions } from './hooks/useSessions';

import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { TitleBar } from './components/layout/TitleBar';
import { DownloadProgressPanel } from './components/download/DownloadProgressPanel';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { ManagerPage } from './pages/ManagerPage';
import { SettingsPage } from './pages/SettingsPage';

type Tab = 'search' | 'manager' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [searchParams, setSearchParams] = useState<SearchParams>(DEFAULT_SEARCH_PARAMS);
  const [concurrency, setConcurrency] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isElectron, setIsElectron] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setIsElectron(!!(window?.process?.type === 'renderer'));
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const { cpus, envStatus, setEnvStatus } = useSystemInfo();
  const { sessions, isLoading: isLoadingSessions, fetchSessions, deleteSession } = useSessions();
  const {
    keywords, setKeywords, selectedKeywords, toggleKeyword,
    isExpandingKeywords, results, isSearching, sessionId,
    expandKeywords, search,
  } = useSearch(searchParams);

  // After a download, switch to manager and refresh sessions
  const onDownloadSuccess = () => {
    fetchSessions();
  };

  const { downloadingIds, tasks, downloadItem, downloadBatch, clearTasks } = useDownload(concurrency, onDownloadSuccess);

  useEffect(() => { setConcurrency(cpus); }, [cpus]);

  // Auto-fetch sessions when switching to manager tab
  useEffect(() => {
    if (activeTab === 'manager') fetchSessions();
  }, [activeTab]);

  const sessionMeta = {
    sessionId,
    sessionQuery: searchParams.query,
    sessionKeywords: keywords.filter((kw) => selectedKeywords.has(kw)),
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.size === results.length && results.length > 0
      ? new Set() : new Set(results.map((r) => r.id)));

  const totalAssets = sessions.reduce((s, sess) => s + sess.resources.length, 0);

  return (
    <div className="flex flex-col h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-600 selection:text-white overflow-hidden">
      <Toaster position="top-right" richColors />
      {isElectron && <TitleBar />}
      <DownloadProgressPanel tasks={tasks} onClose={clearTasks} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isElectron={isElectron}
          concurrency={concurrency}
          systemCpus={cpus}
          deferredPrompt={deferredPrompt}
          onInstall={handleInstall}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto p-8">
            {activeTab === 'search' && (
              <DiscoveryPage
                searchParams={searchParams}
                onSearchParamsChange={setSearchParams}
                keywords={keywords}
                selectedKeywords={selectedKeywords}
                onToggleKeyword={toggleKeyword}
                onClearKeywords={() => { setKeywords([]); }}
                isExpandingKeywords={isExpandingKeywords}
                onExpandKeywords={expandKeywords}
                results={results}
                isSearching={isSearching}
                onSearch={search}
                downloadingIds={downloadingIds}
                onDownload={(item) => downloadItem(item, sessionMeta)}
                onDownloadBatch={(items) => downloadBatch(items, sessionMeta)}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={toggleSelectAll}
                concurrency={concurrency}
                onConcurrencyChange={setConcurrency}
                systemCpus={cpus}
                envStatus={envStatus}
                onGoToSettings={() => setActiveTab('settings')}
              />
            )}

            {activeTab === 'manager' && (
              <ManagerPage
                sessions={sessions}
                isLoading={isLoadingSessions}
                onRefresh={fetchSessions}
                onDeleteSession={deleteSession}
                onDeleteResource={async (filename) => {
                  const { api } = await import('./lib/api');
                  await api.deleteResource(filename);
                  fetchSessions();
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage envStatus={envStatus} onEnvStatusChange={setEnvStatus} />
            )}
          </main>

          <StatusBar systemCpus={cpus} resourceCount={totalAssets} />
        </div>
      </div>
    </div>
  );
}
