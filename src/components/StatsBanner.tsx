import React from 'react';
import { Sparkles, Clock, FileText, Trash2, ExternalLink, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { ScrapedArticleMetadata, ScrapeStats } from '../types';

interface StatsBannerProps {
  metadata: ScrapedArticleMetadata;
  stats: ScrapeStats;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ metadata, stats }) => {
  const formatBytes = (chars: number) => {
    if (chars > 1024 * 1024) return `${(chars / (1024 * 1024)).toFixed(1)} MB`;
    if (chars > 1024) return `${(chars / 1024).toFixed(1)} KB`;
    return `${chars} B`;
  };

  return (
    <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Article Source & Title snippet */}
        <div className="flex items-center gap-2 min-w-0 max-w-full sm:max-w-md lg:max-w-xl">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {metadata.title}
          </span>
          {metadata.url && !metadata.url.startsWith('https://local-upload') && (
            <a
              href={metadata.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0 inline-flex items-center gap-1"
              title="Open Original Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Right: Metrics Badges */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-zinc-600 dark:text-zinc-400">
          {/* Bloat Reduction */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{stats.reductionPercentage}% Bloat Stripped</span>
            <span className="opacity-70 text-[11px]">
              ({formatBytes(stats.rawCharCount)} → {formatBytes(stats.cleanedCharCount)})
            </span>
          </div>

          {/* Tags purged */}
          <div className="hidden md:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800">
            <Trash2 className="w-3 h-3 text-zinc-500" />
            <span>{stats.tagsStrippedCount} noise tags purged</span>
          </div>

          {/* Read time & Word count */}
          <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{metadata.readTimeMinutes} min read</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800">
            <FileText className="w-3 h-3 text-zinc-500" />
            <span>{metadata.wordCount.toLocaleString()} words</span>
          </div>
        </div>
      </div>
    </div>
  );
};
