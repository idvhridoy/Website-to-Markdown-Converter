import React, { useState, useRef } from 'react';
import {
  Globe,
  Upload,
  FileCode,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Table as TableIcon,
  Link as LinkIcon,
  FileText,
  SlidersHorizontal,
  X,
  ClipboardPaste,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ScrapeOptions } from '../types';

interface InputZoneProps {
  urlInput: string;
  onChangeUrl: (val: string) => void;
  onSubmitUrl: () => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  options: ScrapeOptions;
  onOptionsChange: (newOptions: ScrapeOptions) => void;
}

export const InputZone: React.FC<InputZoneProps> = ({
  urlInput,
  onChangeUrl,
  onSubmitUrl,
  onFileUpload,
  isLoading,
  options,
  onOptionsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'paste'>('url');
  const [isDragging, setIsDragging] = useState(false);
  const [pastedHtml, setPastedHtml] = useState('');
  const [showAdvancedToggles, setShowAdvancedToggles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeUrl(text.trim());
      }
    } catch {
      // Browser permission prompt or fallback
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && urlInput.trim()) {
      onSubmitUrl();
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
            <button
              id="tab-url"
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web URL</span>
            </button>
            <button
              id="tab-file"
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
            <button
              id="tab-paste"
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Direct HTML</span>
            </button>
          </div>

          <button
            id="btn-toggle-settings"
            onClick={() => setShowAdvancedToggles(!showAdvancedToggles)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showAdvancedToggles
                ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Extraction Settings</span>
            <span className="sm:hidden">Settings</span>
          </button>
        </div>

        {/* Input Bodies */}
        {activeTab === 'url' && (
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                id="url-input"
                type="url"
                value={urlInput}
                onChange={(e) => onChangeUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste article URL to clean &amp; convert (e.g. https://en.wikipedia.org/wiki/...)"
                className="w-full pl-10 pr-20 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all shadow-xs"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {urlInput ? (
                  <button
                    id="btn-clear-url"
                    onClick={() => onChangeUrl('')}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-paste-clipboard"
                    onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-700/60 rounded-md transition-colors"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                )}
              </div>
            </div>

            <button
              id="btn-scrape-url"
              onClick={onSubmitUrl}
              disabled={isLoading || !urlInput.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scraping &amp; Stripping...</span>
                </>
              ) : (
                <>
                  <span>Scrape &amp; Convert</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'file' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".html,.htm,.txt,.md,.mhtml"
              className="hidden"
            />
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Drag &amp; drop your <code className="text-indigo-600 dark:text-indigo-400">.html</code>, <code className="text-indigo-600 dark:text-indigo-400">.htm</code>, or <code className="text-indigo-600 dark:text-indigo-400">.txt</code> file here
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              or click to browse from device (up to 25MB). Runs completely in-memory.
            </p>
          </div>
        )}

        {activeTab === 'paste' && (
          <div className="space-y-2">
            <textarea
              value={pastedHtml}
              onChange={(e) => setPastedHtml(e.target.value)}
              placeholder="Paste raw HTML source code here to strip ads, scripts and convert into Markdown or Notion blocks..."
              rows={3}
              className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all shadow-xs"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (pastedHtml.trim()) {
                    const blob = new Blob([pastedHtml], { type: 'text/html' });
                    const file = new File([blob], 'pasted-article.html', { type: 'text/html' });
                    onFileUpload(file);
                  }
                }}
                disabled={isLoading || !pastedHtml.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-medium text-xs rounded-lg transition-all disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Process Raw HTML</span>
              </button>
            </div>
          </div>
        )}

        {/* Configuration Toggles */}
        {showAdvancedToggles && (
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="checkbox"
                checked={options.includeMetadata}
                onChange={(e) => onOptionsChange({ ...options, includeMetadata: e.target.checked })}
                className="rounded text-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>YAML Frontmatter</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="checkbox"
                checked={options.preserveImages}
                onChange={(e) => onOptionsChange({ ...options, preserveImages: e.target.checked })}
                className="rounded text-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Preserve Images</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="checkbox"
                checked={options.preserveTables}
                onChange={(e) => onOptionsChange({ ...options, preserveTables: e.target.checked })}
                className="rounded text-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <TableIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Format Tables</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="checkbox"
                checked={options.preserveLinks}
                onChange={(e) => onOptionsChange({ ...options, preserveLinks: e.target.checked })}
                className="rounded text-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Preserve Links</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors col-span-2 sm:col-span-1">
              <input
                type="checkbox"
                checked={options.enableAiClean}
                onChange={(e) => onOptionsChange({ ...options, enableAiClean: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Restructure</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
