import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputZone } from './components/InputZone';
import { StatsBanner } from './components/StatsBanner';
import { DualPaneEditor } from './components/DualPaneEditor';
import { ExportToolbar } from './components/ExportToolbar';
import { BatchScraperModal } from './components/BatchScraperModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ScrapeOptions, ScrapeResult } from './types';
import { INITIAL_SAMPLE_RESULT } from './data/sampleArticle';

export default function App() {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScrapeResult>(INITIAL_SAMPLE_RESULT);
  const [editedMarkdown, setEditedMarkdown] = useState<string>(INITIAL_SAMPLE_RESULT.markdown);
  const [originalMarkdown, setOriginalMarkdown] = useState<string>(INITIAL_SAMPLE_RESULT.markdown);
  const [activeEngine, setActiveEngine] = useState<'fast' | 'ai'>('fast');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [options, setOptions] = useState<ScrapeOptions>({
    preserveImages: true,
    preserveTables: true,
    preserveLinks: true,
    includeMetadata: true,
    targetFormat: 'both',
    enableAiClean: false,
  });

  // Check health and Gemini API key presence on server
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey) {
          setHasGeminiKey(true);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleScrape = async (targetUrl?: string) => {
    const finalUrl = targetUrl || urlInput.trim();
    if (!finalUrl) {
      addToast('error', 'URL is required', 'Please provide an article URL to scrape.');
      return;
    }

    try {
      new URL(finalUrl);
    } catch {
      addToast('error', 'Invalid URL format', 'Please ensure the URL includes http:// or https://');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          options: {
            ...options,
            enableAiClean: activeEngine === 'ai',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract article.');
      }

      setCurrentResult(data);
      setEditedMarkdown(data.markdown);
      setOriginalMarkdown(data.markdown);
      setUrlInput(finalUrl);

      addToast(
        'success',
        'Scraped & Converted Successfully!',
        `${data.stats.reductionPercentage}% bloat stripped (${data.metadata.wordCount} words).`
      );
    } catch (err: any) {
      addToast('error', 'Scraping Failed', err.message || 'Could not retrieve content from target URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // 25MB max size check
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      addToast('error', 'File too large', 'Max file size allowed is 25MB.');
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      if (!text.trim()) {
        throw new Error('The uploaded file appears to be empty.');
      }

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: text,
          options: {
            ...options,
            enableAiClean: activeEngine === 'ai',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse uploaded document.');
      }

      setCurrentResult(data);
      setEditedMarkdown(data.markdown);
      setOriginalMarkdown(data.markdown);
      setUrlInput(`local://${file.name}`);

      addToast(
        'success',
        'Document Parsed!',
        `Converted ${file.name} to clean Markdown and ${data.notionBlocks.length} Notion blocks.`
      );
    } catch (err: any) {
      addToast('error', 'Upload Processing Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAiRefine = async () => {
    setIsAiRefining(true);
    try {
      const response = await fetch('/api/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentResult.metadata.title,
          markdown: editedMarkdown,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI enhancement failed');
      }

      setEditedMarkdown(data.enhancedMarkdown);
      addToast('success', 'AI Refined!', 'Article restructured with Executive TL;DR and polished hierarchy.');
    } catch (err: any) {
      addToast('error', 'AI Refinement Error', err.message);
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrlInput(presetUrl);
    handleScrape(presetUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-950">
      {/* Top Application Bar */}
      <Header
        onSelectPreset={handleSelectPreset}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        isAiAvailable={hasGeminiKey}
        activeEngine={activeEngine}
        onChangeEngine={(eng) => {
          setActiveEngine(eng);
          setOptions((prev) => ({ ...prev, enableAiClean: eng === 'ai' }));
        }}
      />

      {/* Primary Ingestion & Configuration Bar */}
      <InputZone
        urlInput={urlInput}
        onChangeUrl={setUrlInput}
        onSubmitUrl={() => handleScrape()}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        options={options}
        onOptionsChange={setOptions}
      />

      {/* Real-time Extraction Statistics Bar */}
      <StatsBanner metadata={currentResult.metadata} stats={currentResult.stats} />

      {/* Dual-Pane Editor & Live Preview Workspace */}
      <DualPaneEditor
        rawMarkdown={editedMarkdown}
        originalMarkdown={originalMarkdown}
        onMarkdownChange={setEditedMarkdown}
        notionBlocks={currentResult.notionBlocks}
        cleanedHtml={currentResult.cleanedHtml}
        metadata={currentResult.metadata}
        onCopySuccess={(msg) => addToast('success', msg)}
        onTriggerAiRefine={handleTriggerAiRefine}
        isAiRefining={isAiRefining}
        hasGeminiKey={hasGeminiKey}
      />

      {/* Export & Clipboard Utility Bar */}
      <ExportToolbar
        markdown={editedMarkdown}
        notionBlocks={currentResult.notionBlocks}
        cleanedHtml={currentResult.cleanedHtml}
        metadata={currentResult.metadata}
        notionClipboardHtml={currentResult.notionClipboardHtml}
        onShowToast={addToast}
      />

      {/* Batch Processing Modal */}
      <BatchScraperModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        options={options}
        onLoadSingleResult={(res) => {
          setCurrentResult(res);
          setEditedMarkdown(res.markdown);
          setOriginalMarkdown(res.markdown);
          setUrlInput(res.metadata.url || '');
          addToast('success', 'Loaded article from batch!');
        }}
        onShowToast={addToast}
      />

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
