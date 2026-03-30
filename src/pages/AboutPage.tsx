import { motion } from 'framer-motion';
import { ExternalLink, Download, Layers, Search, Sparkles, Cpu, Tag } from 'lucide-react';

const FEATURES = [
  {
    icon: Search,
    title: 'Multi-Platform Discovery',
    desc: 'Search high-quality photos and videos across Pexels and Pixabay simultaneously.',
  },
  {
    icon: Sparkles,
    title: 'AI Keyword Expansion',
    desc: 'Automatically generate related search terms via the Datamuse lexical API — no API key required.',
  },
  {
    icon: Download,
    title: 'Batch Download',
    desc: 'Download multiple assets in parallel with configurable concurrency based on your system CPU.',
  },
  {
    icon: Layers,
    title: 'Session Management',
    desc: 'All downloads are organized into sessions so you can track, browse, and manage your media library.',
  },
  {
    icon: Tag,
    title: 'AI Auto-Tagging',
    desc: 'Locally running CLIP model automatically tags downloaded media for faster retrieval.',
  },
  {
    icon: Cpu,
    title: 'System-Aware Performance',
    desc: 'Download concurrency adapts to your CPU core count to keep your system responsive.',
  },
];

const PRIVACY_URL = 'https://github.com/kent236896/omniresource/blob/main/PRIVACY.md';

export function AboutPage() {
  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <img src="/img/omni-logo.png" alt="OmniResource" className="w-14 h-14 rounded-2xl object-contain" />
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">OmniResource</h1>
            <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mt-0.5">
              OmniResource Engine v2.0
            </p>
          </div>
        </div>
        <p className="text-zinc-600 leading-relaxed text-sm">
          OmniResource is an AI-powered desktop application for discovering, downloading, and managing
          high-quality media assets. It integrates with leading stock platforms and uses AI models to
          supercharge your creative workflow — all from a single, fast, offline-capable app.
        </p>
      </motion.div>

      {/* Core Features */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <h2 className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Core Features</h2>
        <div className="grid grid-cols-1 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-zinc-200/60 shadow-sm"
            >
              <div className="mt-0.5 p-2 rounded-xl bg-indigo-50">
                <f.icon size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800">{f.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Version Info */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h2 className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Version Info</h2>
        <div className="rounded-2xl bg-white border border-zinc-200/60 shadow-sm divide-y divide-zinc-100">
          {[
            { label: 'Version', value: '2.0.0' },
            { label: 'Platform', value: 'Windows (Electron)' },
            { label: 'Runtime', value: 'Electron + React 19' },
            { label: 'Build', value: 'Stable' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3">
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-medium">{label}</span>
              <span className="text-xs font-mono font-semibold text-zinc-700">{value}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Author */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <h2 className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Author</h2>
        <div className="rounded-2xl bg-white border border-zinc-200/60 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm font-mono">
            TK
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800">TANGKUN</p>
            <p className="text-xs text-zinc-400 mt-0.5">Developer &amp; Designer</p>
          </div>
        </div>
      </motion.section>

      {/* Links */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Links</h2>
        <button
          onClick={() => handleOpenUrl(PRIVACY_URL)}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-zinc-200/60 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-zinc-800 group-hover:text-indigo-700 transition-colors">
              Privacy Policy
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">How we handle your data</p>
          </div>
          <ExternalLink size={14} className="text-zinc-300 group-hover:text-indigo-500 transition-colors" />
        </button>
      </motion.section>

      {/* Copyright */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-center text-[10px] uppercase tracking-widest text-zinc-300 pb-4"
      >
        © 2026 TANGKUN · OmniResource · All rights reserved
      </motion.p>
    </div>
  );
}
