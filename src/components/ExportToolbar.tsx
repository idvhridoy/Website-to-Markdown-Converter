import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileText,
  FileCode,
  Archive,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { NotionBlock, ScrapedArticleMetadata } from '../types';

interface ExportToolbarProps {
  markdown: string;
  notionBlocks: NotionBlock[];
  cleanedHtml: string;
  metadata: ScrapedArticleMetadata;
  notionClipboardHtml: string;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  markdown,
  notionBlocks,
  cleanedHtml,
  metadata,
  notionClipboardHtml,
  onShowToast,
}) => {
  const [copiedNotion, setCopiedNotion] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Copy with rich clipboard format for direct Notion paste
  const handleCopyForNotion = async () => {
    try {
      const blobHtml = new Blob([notionClipboardHtml || cleanedHtml], { type: 'text/html' });
      const blobText = new Blob([markdown], { type: 'text/plain' });

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(markdown);
      }

      setCopiedNotion(true);
      onShowToast(
        'success',
        'Copied for Notion!',
        'Press Ctrl+V / ⌘+V inside any Notion page to paste native blocks.'
      );
      setTimeout(() => setCopiedNotion(false), 2500);
    } catch {
      // Fallback
      await navigator.clipboard.writeText(markdown);
      setCopiedNotion(true);
      onShowToast('success', 'Copied Markdown to clipboard');
      setTimeout(() => setCopiedNotion(false), 2000);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedMd(true);
      onShowToast('success', 'Copied Markdown!', 'Ready to paste into Obsidian, Bear, or VS Code.');
      setTimeout(() => setCopiedMd(false), 2000);
    } catch (err: any) {
      onShowToast('error', 'Failed to copy', err.message);
    }
  };

  const sanitizeFilename = (name: string) => {
    return (name || 'article')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  const handleDownloadFile = (content: string, ext: string, mime: string) => {
    try {
      const filename = `${sanitizeFilename(metadata.title)}.${ext}`;
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('success', `Downloaded ${filename}`);
      setShowDownloadMenu(false);
    } catch (err: any) {
      onShowToast('error', 'Download failed', err.message);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const baseName = sanitizeFilename(metadata.title);
      const folder = zip.folder(baseName) || zip;

      // 1. Markdown file
      folder.file(`${baseName}.md`, markdown);

      // 2. Notion JSON Blocks file
      folder.file(`${baseName}-notion-blocks.json`, JSON.stringify(notionBlocks, null, 2));

      // 3. Cleaned HTML file
      folder.file(`${baseName}-cleaned.html`, cleanedHtml);

      // 4. Metadata JSON
      folder.file(`metadata.json`, JSON.stringify(metadata, null, 2));

      // 5. README instructions
      const readmeText = `ScrapeMark & Notion Export
============================
Title: ${metadata.title}
Source: ${metadata.url}
Exported: ${new Date().toISOString()}

Included Files:
- ${baseName}.md: Formatted GitHub-Flavored Markdown with YAML frontmatter.
- ${baseName}-notion-blocks.json: Notion Block API Child Block objects.
- ${baseName}-cleaned.html: Sanitized HTML without ads or tracker scripts.
- metadata.json: Document metadata including word count and read time.

How to use in Notion:
1. Open any Notion page.
2. Drag and drop the .md file, or paste content using the "Copy for Notion" button.
`;
      folder.file('README.txt', readmeText);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${baseName}-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      onShowToast('success', 'Zip archive generated!', 'All formats and metadata bundled.');
      setShowDownloadMenu(false);
    } catch (err: any) {
      onShowToast('error', 'Failed to generate ZIP', err.message);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3 shrink-0 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Status Tip */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 hidden md:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Output ready for Notion, Obsidian, Bear, Logseq &amp; static site generators.</span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end">
          {/* Copy Markdown */}
          <button
            id="btn-copy-markdown"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 rounded-xl transition-all shadow-2xs"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{copiedMd ? 'Copied MD' : 'Copy Markdown'}</span>
          </button>

          {/* Copy for Notion Primary */}
          <button
            id="btn-copy-notion"
            onClick={handleCopyForNotion}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl transition-all shadow-xs"
          >
            {copiedNotion ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>Copied for Notion!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
                <span>Copy for Notion</span>
              </>
            )}
          </button>

          {/* Download Dropdown */}
          <div className="relative">
            <button
              id="btn-export-dropdown"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 rounded-xl transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 divide-y divide-zinc-100 dark:divide-zinc-800">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Download File Formats
                  </div>

                  <div className="py-1">
                    <button
                      id="btn-download-md"
                      onClick={() => handleDownloadFile(markdown, 'md', 'text/markdown')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-zinc-500" />
                      <div>
                        <div className="font-medium">Markdown (.md)</div>
                        <div className="text-[10px] text-zinc-400">GFM with YAML frontmatter</div>
                      </div>
                    </button>

                    <button
                      id="btn-download-json"
                      onClick={() =>
                        handleDownloadFile(JSON.stringify(notionBlocks, null, 2), 'json', 'application/json')
                      }
                      className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <FileCode className="w-4 h-4 text-indigo-500" />
                      <div>
                        <div className="font-medium">Notion Blocks (.json)</div>
                        <div className="text-[10px] text-zinc-400">Notion API schema blocks</div>
                      </div>
                    </button>

                    <button
                      id="btn-download-html"
                      onClick={() => handleDownloadFile(cleanedHtml, 'html', 'text/html')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <FileCode className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="font-medium">Cleaned HTML (.html)</div>
                        <div className="text-[10px] text-zinc-400">Ad-stripped reader document</div>
                      </div>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      id="btn-download-zip"
                      onClick={handleExportZip}
                      disabled={isExportingZip}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
                    >
                      <Archive className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-medium">
                          {isExportingZip ? 'Packaging Zip...' : 'Complete ZIP Bundle'}
                        </div>
                        <div className="text-[10px] text-zinc-400">All formats + metadata + README</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
