export interface ScrapedArticleMetadata {
  title: string;
  author: string | null;
  publishedTime: string | null;
  siteName: string | null;
  excerpt: string | null;
  url: string;
  favicon: string | null;
  wordCount: number;
  readTimeMinutes: number;
}

export interface ScrapeStats {
  rawCharCount: number;
  cleanedCharCount: number;
  reductionPercentage: number;
  tagsStrippedCount: number;
  imagesFound: number;
  linksFound: number;
}

export interface NotionRichText {
  type: 'text';
  text: {
    content: string;
    link?: { url: string } | null;
  };
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

export interface NotionBlock {
  object: 'block';
  type: string;
  id?: string;
  [key: string]: any;
}

export interface ScrapeResult {
  metadata: ScrapedArticleMetadata;
  markdown: string;
  notionBlocks: NotionBlock[];
  cleanedHtml: string;
  stats: ScrapeStats;
  notionClipboardHtml: string;
}

export interface ScrapeOptions {
  preserveImages: boolean;
  preserveTables: boolean;
  preserveLinks: boolean;
  includeMetadata: boolean;
  targetFormat: 'markdown' | 'notion' | 'both';
  enableAiClean: boolean;
}

export interface SamplePreset {
  title: string;
  url: string;
  category: string;
  desc: string;
}

export interface BatchItem {
  url: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  data?: ScrapeResult;
}

export type LeftPaneMode = 'markdown' | 'notion-json' | 'html';
export type RightPaneMode = 'rendered' | 'notion-view' | 'block-tree';
