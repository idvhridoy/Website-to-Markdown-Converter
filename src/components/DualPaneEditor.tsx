import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Code,
  FileText,
  Eye,
  Layers,
  Copy,
  Check,
  Search,
  WrapText,
  RotateCcw,
  Maximize2,
  Minimize2,
  Brackets,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { NotionBlock, ScrapedArticleMetadata, LeftPaneMode, RightPaneMode } from '../types';
import { NotionView } from './NotionView';

interface DualPaneEditorProps {
  rawMarkdown: string;
  originalMarkdown: string;
  onMarkdownChange: (newMd: string) => void;
  notionBlocks: NotionBlock[];
  cleanedHtml: string;
  metadata: ScrapedArticleMetadata;
  onCopySuccess: (msg: string) => void;
  onTriggerAiRefine?: () => void;
  isAiRefining?: boolean;
  hasGeminiKey?: boolean;
}

export const DualPaneEditor: React.FC<DualPaneEditorProps> = ({
  rawMarkdown,
  originalMarkdown,
  onMarkdownChange,
  notionBlocks,
  cleanedHtml,
  metadata,
  onCopySuccess,
  onTriggerAiRefine,
  isAiRefining = false,
  hasGeminiKey = false,
}) => {
  const [leftMode, setLeftMode] = useState<LeftPaneMode>('markdown');
  const [rightMode, setRightMode] = useState<RightPaneMode>('rendered');
  const [mobileActiveTab, setMobileActiveTab] = useState<'left' | 'right'>('right');
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncScroll, setIsSyncScroll] = useState(true);
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);

  // Synchronized scrolling between left and right pane
  const handleLeftScroll = () => {
    if (!isSyncScroll || isScrollingSyncRef.current) return;
    const leftEl = leftScrollRef.current;
    const rightEl = rightScrollRef.current;
    if (!leftEl || !rightEl) return;

    isScrollingSyncRef.current = true;
    const scrollRatio = leftEl.scrollTop / (leftEl.scrollHeight - leftEl.clientHeight || 1);
    rightEl.scrollTop = scrollRatio * (rightEl.scrollHeight - rightEl.clientHeight);
    setTimeout(() => {
      isScrollingSyncRef.current = false;
    }, 50);
  };

  const handleRightScroll = () => {
    if (!isSyncScroll || isScrollingSyncRef.current) return;
    const leftEl = leftScrollRef.current;
    const rightEl = rightScrollRef.current;
    if (!leftEl || !rightEl) return;

    isScrollingSyncRef.current = true;
    const scrollRatio = rightEl.scrollTop / (rightEl.scrollHeight - rightEl.clientHeight || 1);
    leftEl.scrollTop = scrollRatio * (leftEl.scrollHeight - leftEl.clientHeight);
    setTimeout(() => {
      isScrollingSyncRef.current = false;
    }, 50);
  };

  const currentLeftContent =
    leftMode === 'markdown'
      ? rawMarkdown
      : leftMode === 'notion-json'
      ? JSON.stringify(notionBlocks, null, 2)
      : cleanedHtml;

  const handleCopyCurrentLeft = () => {
    navigator.clipboard.writeText(currentLeftContent);
    setCopiedLeft(true);
    onCopySuccess(
      leftMode === 'markdown'
        ? 'Markdown copied to clipboard'
        : leftMode === 'notion-json'
        ? 'Notion Blocks JSON copied'
        : 'HTML copied'
    );
    setTimeout(() => setCopiedLeft(false), 2000);
  };

  // Generate line numbers for editor
  const lineCount = currentLeftContent.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-100 dark:bg-zinc-950 transition-colors">
      {/* Mobile Responsive Tab Switcher */}
      <div className="lg:hidden flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 justify-between items-center">
        <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 text-xs font-medium w-full">
          <button
            onClick={() => setMobileActiveTab('left')}
            className={`flex-1 py-1.5 rounded-md text-center transition-all ${
              mobileActiveTab === 'left'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Raw Editor ({leftMode === 'markdown' ? 'Markdown' : leftMode === 'notion-json' ? 'JSON' : 'HTML'})
          </button>
          <button
            onClick={() => setMobileActiveTab('right')}
            className={`flex-1 py-1.5 rounded-md text-center transition-all ${
              mobileActiveTab === 'right'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Live Preview ({rightMode === 'rendered' ? 'Article' : rightMode === 'notion-view' ? 'Notion' : 'AST'})
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800 min-h-0">
        {/* ================= LEFT PANE (INPUT / RAW STATE / EDITOR) ================= */}
        <div
          className={`flex flex-col min-h-0 bg-white dark:bg-zinc-900 ${
            mobileActiveTab === 'left' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Left Toolbar */}
          <div className="h-11 border-b border-zinc-200 dark:border-zinc-800 px-3.5 flex items-center justify-between gap-2 text-xs bg-zinc-50/70 dark:bg-zinc-900/80 shrink-0">
            {/* Mode Selectors */}
            <div className="flex items-center gap-1">
              <button
                id="btn-left-mode-md"
                onClick={() => setLeftMode('markdown')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  leftMode === 'markdown'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>Markdown Raw</span>
              </button>

              <button
                id="btn-left-mode-json"
                onClick={() => setLeftMode('notion-json')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  leftMode === 'notion-json'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Brackets className="w-3.5 h-3.5 text-indigo-500" />
                <span>Notion Blocks JSON</span>
              </button>

              <button
                id="btn-left-mode-html"
                onClick={() => setLeftMode('html')}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  leftMode === 'html'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cleaned HTML</span>
              </button>
            </div>

            {/* Editor Utilities */}
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              {leftMode === 'markdown' && rawMarkdown !== originalMarkdown && (
                <button
                  onClick={() => onMarkdownChange(originalMarkdown)}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                  title="Revert modifications to original scraped state"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}

              {/* AI Refine Button */}
              {onTriggerAiRefine && leftMode === 'markdown' && (
                <button
                  onClick={onTriggerAiRefine}
                  disabled={isAiRefining}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                  title={hasGeminiKey ? 'Refine structure & generate Executive TL;DR with Gemini' : 'Gemini AI Refine'}
                >
                  <Sparkles className={`w-3 h-3 ${isAiRefining ? 'animate-spin' : ''}`} />
                  <span>{isAiRefining ? 'Refining...' : 'AI Refine'}</span>
                </button>
              )}

              {/* Word Wrap Toggle */}
              <button
                onClick={() => setIsWordWrap(!isWordWrap)}
                className={`p-1.5 rounded transition-colors ${
                  isWordWrap
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title="Toggle Word Wrap"
              >
                <WrapText className="w-3.5 h-3.5" />
              </button>

              {/* Copy Raw */}
              <button
                onClick={handleCopyCurrentLeft}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                title="Copy Content"
              >
                {copiedLeft ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLeft ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Left Editor Body with Line Numbers */}
          <div
            ref={leftScrollRef}
            onScroll={handleLeftScroll}
            className="flex-1 overflow-auto flex text-xs font-mono bg-zinc-900 text-zinc-100 select-text"
          >
            {/* Line numbers gutter */}
            <div className="py-4 pl-3 pr-2 text-right select-none text-zinc-600 bg-zinc-950/60 border-r border-zinc-800 shrink-0 font-mono text-[11px] leading-5">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Editable Content Area */}
            {leftMode === 'markdown' ? (
              <textarea
                value={rawMarkdown}
                onChange={(e) => onMarkdownChange(e.target.value)}
                spellCheck={false}
                className={`flex-1 p-4 bg-transparent outline-none resize-none font-mono text-xs leading-5 text-zinc-200 focus:ring-0 border-none ${
                  isWordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
                }`}
              />
            ) : (
              <pre
                className={`flex-1 p-4 bg-transparent font-mono text-xs leading-5 text-zinc-200 outline-none select-text ${
                  isWordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
                }`}
              >
                <code>{currentLeftContent}</code>
              </pre>
            )}
          </div>

          {/* Left Footer Status Bar */}
          <div className="h-7 border-t border-zinc-200 dark:border-zinc-800 px-3.5 flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 shrink-0">
            <span>{lineCount} lines • {currentLeftContent.length.toLocaleString()} characters</span>
            <span className="capitalize">{leftMode === 'markdown' ? 'Editable Markdown' : 'Read-Only JSON'}</span>
          </div>
        </div>

        {/* ================= RIGHT PANE (OUTPUT / PROCESSED STATE / LIVE PREVIEW) ================= */}
        <div
          className={`flex flex-col min-h-0 bg-white dark:bg-zinc-900 ${
            mobileActiveTab === 'right' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Right Toolbar */}
          <div className="h-11 border-b border-zinc-200 dark:border-zinc-800 px-3.5 flex items-center justify-between gap-2 text-xs bg-zinc-50/70 dark:bg-zinc-900/80 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1">
              <button
                id="btn-right-mode-rendered"
                onClick={() => setRightMode('rendered')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  rightMode === 'rendered'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>Rendered Article</span>
              </button>

              <button
                id="btn-right-mode-notion"
                onClick={() => setRightMode('notion-view')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  rightMode === 'notion-view'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-serif">N</span>
                <span>Notion Canvas</span>
              </button>

              <button
                id="btn-right-mode-tree"
                onClick={() => setRightMode('block-tree')}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  rightMode === 'block-tree'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Notion Block Tree</span>
              </button>
            </div>

            {/* Right Pane Controls */}
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              {/* Sync Scroll Toggle */}
              <button
                id="btn-sync-scroll"
                onClick={() => setIsSyncScroll(!isSyncScroll)}
                className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
                  isSyncScroll
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
                title="Synchronized dual-pane scrolling"
              >
                <span>Sync Scroll: {isSyncScroll ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Right Preview Body */}
          <div
            ref={rightScrollRef}
            onScroll={handleRightScroll}
            className="flex-1 overflow-auto p-4 sm:p-8 bg-white dark:bg-zinc-900"
          >
            {rightMode === 'rendered' && (
              <div className="max-w-3xl mx-auto prose dark:prose-invert prose-zinc prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-xl prose-img:shadow-xs prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:border prose-pre:border-zinc-800">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, ...props }) => (
                      <img {...props} className="rounded-xl max-h-96 w-auto mx-auto shadow-xs border border-zinc-200 dark:border-zinc-800" loading="lazy" referrerPolicy="no-referrer" />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <table {...props} className="min-w-full text-xs sm:text-sm divide-y divide-zinc-200 dark:divide-zinc-800" />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th {...props} className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-left font-semibold text-zinc-900 dark:text-zinc-100" />
                    ),
                    td: ({ node, ...props }) => (
                      <td {...props} className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800" />
                    ),
                  }}
                >
                  {rawMarkdown}
                </ReactMarkdown>
              </div>
            )}

            {rightMode === 'notion-view' && (
              <NotionView
                blocks={notionBlocks}
                title={metadata.title}
                sourceUrl={metadata.url}
                author={metadata.author}
                readTimeMinutes={metadata.readTimeMinutes}
              />
            )}

            {rightMode === 'block-tree' && (
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-xs">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Notion Block Schema Overview
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    {notionBlocks.length} total blocks generated adhering to official Notion API Child Block Schema.
                  </p>
                </div>

                <div className="space-y-2">
                  {notionBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                        <span className="text-indigo-600 dark:text-indigo-400">#{idx + 1} {block.type}</span>
                        <span className="text-[10px] text-zinc-400">object: {block.object}</span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 text-[11px] line-clamp-2">
                        {JSON.stringify(block[block.type])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Footer Status Bar */}
          <div className="h-7 border-t border-zinc-200 dark:border-zinc-800 px-3.5 flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 shrink-0">
            <span>{notionBlocks.length} Notion Blocks • Ready to Export</span>
            <span>GFM Tables &amp; Code Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};
