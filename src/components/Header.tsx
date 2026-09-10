import React, { useState } from 'react';
import { Layers, Sparkles, Zap, ListFilter, HelpCircle, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { SamplePreset } from '../types';

interface HeaderProps {
  onSelectPreset: (url: string) => void;
  onOpenBatchModal: () => void;
  isAiAvailable: boolean;
  activeEngine: 'fast' | 'ai';
  onChangeEngine: (engine: 'fast' | 'ai') => void;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    title: 'Wikipedia: Artificial Intelligence',
    url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    category: 'Encyclopedia / Dense Data',
    desc: 'Deep hierarchical headings, tables, references, and citations.',
  },
  {
    title: 'MDN: Web Components',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components',
    category: 'Technical Docs',
    desc: 'Code blocks, interfaces, breadcrumb navigations, and API definitions.',
  },
  {
    title: 'BBC Tech News Story',
    url: 'https://www.bbc.com/news/technology',
    category: 'News Article',
    desc: 'Heavy ad slots, sponsored sidebars, media captions, and tracking scripts.',
  },
  {
    title: 'GitHub Blog: Engineering',
    url: 'https://github.blog/',
    category: 'Engineering Blog',
    desc: 'Rich media, author cards, inline code snippets, and social widgets.',
  },
];

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onOpenBatchModal,
  isAiAvailable,
  activeEngine,
  onChangeEngine,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg tracking-tight">
                ScrapeMark <span className="text-zinc-400 font-normal">&amp;</span> Notion
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                100% In-Memory
              </span>
            </div>
            <p className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400">
              Strips ads, scripts &amp; clutter into clean Markdown and Notion-ready blocks
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Engine Selector */}
          <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              id="btn-engine-fast"
              onClick={() => onChangeEngine('fast')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeEngine === 'fast'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Fast Engine</span>
            </button>
            <button
              id="btn-engine-ai"
              onClick={() => onChangeEngine('ai')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeEngine === 'ai'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Refine</span>
              {isAiAvailable && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Preset Sample URLs Dropdown */}
          <div className="relative">
            <button
              id="btn-presets-menu"
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors"
            >
              <ListFilter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Try Sample URLs</span>
              <span className="sm:hidden">Samples</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showPresetsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPresetsMenu(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 z-50 divide-y divide-zinc-100 dark:divide-zinc-800">
                  <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                    Curated Sample Articles
                  </div>
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      onClick={() => {
                        onSelectPreset(preset.url);
                        setShowPresetsMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {preset.title}
                        </div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                          {preset.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Batch Ingestion Button */}
          <button
            onClick={onOpenBatchModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Batch URLs</span>
          </button>

          {/* Notion Quick Help Modal Button */}
          <button
            onClick={() => setShowInfoModal(true)}
            aria-label="How to use Notion blocks"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notion Quick Help Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm">
                  N
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                  Pasting into Notion &amp; Knowledge Bases
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Method 1: Instant Notion Paste
                </div>
                <p>
                  Click the <strong>"Copy for Notion"</strong> button. Open any Notion page, press <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">⌘+V</kbd>. Notion will automatically convert headings, blockquotes, lists, and code blocks into native Notion blocks!
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Method 2: Notion API Block Payload
                </div>
                <p>
                  Switch to the <strong>"Notion Blocks JSON"</strong> view to copy or download compliant Notion Block API objects (<code className="text-indigo-600 dark:text-indigo-400">@notionhq/client</code> child blocks) ready for programmatic insertion via Notion automations.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Method 3: Obsidian, Bear &amp; Markdown
                </div>
                <p>
                  Click <strong>"Copy Markdown"</strong> or <strong>"Download .md"</strong> with structured YAML frontmatter (source URL, author, reading time, and clean GFM tables).
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
