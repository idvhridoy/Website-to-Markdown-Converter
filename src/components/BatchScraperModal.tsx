import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Download, ListPlus, Archive, ExternalLink } from 'lucide-react';
import JSZip from 'jszip';
import { BatchItem, ScrapeOptions, ScrapeResult } from '../types';

interface BatchScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ScrapeOptions;
  onLoadSingleResult: (result: ScrapeResult) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const BatchScraperModal: React.FC<BatchScraperModalProps> = ({
  isOpen,
  onClose,
  options,
  onLoadSingleResult,
  onShowToast,
}) => {
  const [urlsText, setUrlsText] = useState(
    `https://en.wikipedia.org/wiki/Artificial_intelligence\nhttps://developer.mozilla.org/en-US/docs/Web/API/Web_components\nhttps://github.blog/`
  );
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  if (!isOpen) return null;

  const handleStartBatch = async () => {
    const rawLines = urlsText.split('\n').map((l) => l.trim()).filter(Boolean);
    const validUrls = rawLines.filter((l) => l.startsWith('http://') || l.startsWith('https://'));

    if (validUrls.length === 0) {
      onShowToast('error', 'No valid URLs provided', 'Please enter full HTTP or HTTPS URLs, one per line.');
      return;
    }

    if (validUrls.length > 10) {
      onShowToast('info', 'Capping at 10 URLs', 'Batch processing is limited to 10 URLs per run for performance.');
    }

    const initialItems: BatchItem[] = validUrls.slice(0, 10).map((url) => ({
      url,
      status: 'pending',
    }));

    setItems(initialItems);
    setIsProcessing(true);
    setProgressPct(0);

    try {
      const response = await fetch('/api/batch-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: validUrls.slice(0, 10),
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process batch scrape.');
      }

      const updatedItems: BatchItem[] = data.results.map((res: any) => {
        if (res.status === 'success') {
          return {
            url: res.url,
            status: 'success',
            data: res.data,
          };
        } else {
          return {
            url: res.url,
            status: 'error',
            error: res.error || 'Failed to scrape',
          };
        }
      });

      setItems(updatedItems);
      setProgressPct(100);
      const successCount = updatedItems.filter((i) => i.status === 'success').length;
      onShowToast(
        'success',
        'Batch completed!',
        `Successfully scraped ${successCount} of ${updatedItems.length} articles.`
      );
    } catch (err: any) {
      onShowToast('error', 'Batch processing error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    const successfulItems = items.filter((i) => i.status === 'success' && i.data);
    if (successfulItems.length === 0) {
      onShowToast('info', 'No successful articles to bundle');
      return;
    }

    try {
      const zip = new JSZip();
      const batchFolder = zip.folder('scraped-articles-bundle') || zip;

      successfulItems.forEach((item, index) => {
        const title = item.data!.metadata.title || `article-${index + 1}`;
        const sanitized = title
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .slice(0, 40);

        const subfolder = batchFolder.folder(sanitized) || batchFolder;
        subfolder.file(`${sanitized}.md`, item.data!.markdown);
        subfolder.file(`${sanitized}-notion-blocks.json`, JSON.stringify(item.data!.notionBlocks, null, 2));
        subfolder.file(`metadata.json`, JSON.stringify(item.data!.metadata, null, 2));
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-scraped-articles.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onShowToast('success', 'Batch ZIP downloaded!', 'Contains Markdown and Notion Blocks for each article.');
    } catch (err: any) {
      onShowToast('error', 'Failed to generate ZIP', err.message);
    }
  };

  const successCount = items.filter((i) => i.status === 'success').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                Batch URL Scraper &amp; Archive Exporter
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Scrape multiple articles concurrently and export them as a single ZIP package.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Enter URLs (One per line, up to 10):
            </label>
            <textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              disabled={isProcessing}
              rows={4}
              placeholder="https://example.com/article-1&#10;https://example.com/article-2&#10;https://example.com/article-3"
              className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all shadow-xs"
            />
          </div>

          {/* Progress Bar if processing */}
          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  Scraping batch in parallel...
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 animate-pulse"
                  style={{ width: '80%' }}
                />
              </div>
            </div>
          )}

          {/* Item List */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Batch Items Status ({successCount}/{items.length} completed)
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {item.data?.metadata?.title || item.url}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">{item.url}</div>
                      {item.error && <div className="text-[11px] text-rose-500 mt-0.5">{item.error}</div>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                          Queued
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Processing
                        </span>
                      )}
                      {item.status === 'success' && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Cleaned
                          </span>
                          <button
                            onClick={() => {
                              if (item.data) {
                                onLoadSingleResult(item.data);
                                onClose();
                              }
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            Open
                          </button>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {successCount > 0 && (
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All as ZIP ({successCount})</span>
              </button>
            )}

            <button
              onClick={handleStartBatch}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-medium text-xs rounded-xl transition-all shadow-xs disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Start Batch Scraping</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
