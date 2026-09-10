import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';
import { htmlToNotionBlocks, NotionBlock } from './notion.js';

export interface ScrapeOptions {
  preserveImages?: boolean;
  preserveTables?: boolean;
  preserveLinks?: boolean;
  includeMetadata?: boolean;
  targetFormat?: 'markdown' | 'notion' | 'both';
  customSelector?: string;
  enableAiClean?: boolean;
}

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

export interface ScrapeResult {
  metadata: ScrapedArticleMetadata;
  markdown: string;
  notionBlocks: NotionBlock[];
  cleanedHtml: string;
  stats: ScrapeStats;
  notionClipboardHtml: string;
}

// Selectors for elements that represent navigation, ads, cookies, banners, popups
const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe:not([src*="youtube"]):not([src*="vimeo"])',
  'nav',
  'aside',
  'footer',
  'header:not(article header)',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[role="complementary"]',
  '[aria-modal="true"]',
  '.ad',
  '.ads',
  '.advertisement',
  '.ad-container',
  '.ad-slot',
  '.ad-banner',
  '.ad-wrapper',
  '.banner-ad',
  '.sponsor',
  '.sponsored-content',
  '.taboola',
  '.outbrain',
  '.cookie-banner',
  '.cookie-consent',
  '.cookie-notice',
  '#onetrust-consent-sdk',
  '.popup',
  '.modal',
  '.dialog',
  '.newsletter-signup',
  '.subscribe-box',
  '.social-share',
  '.share-bar',
  '.share-buttons',
  '.comments-section',
  '#comments',
  '.disclaimer',
  '.related-posts',
  '.recommended-stories',
  '.sidebar',
];

export async function fetchAndScrape(
  inputUrlOrHtml: string,
  options: ScrapeOptions = {},
  isDirectHtml: boolean = false
): Promise<ScrapeResult> {
  let rawHtml = '';
  let sourceUrl = isDirectHtml ? 'https://local-upload.source' : inputUrlOrHtml;

  if (isDirectHtml) {
    rawHtml = inputUrlOrHtml;
  } else {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(inputUrlOrHtml.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
      }
      sourceUrl = parsedUrl.href;
    } catch {
      throw new Error(`Invalid URL provided: "${inputUrlOrHtml}". Please check formatting.`);
    }

    // Fetch HTML with realistic browser headers and 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(sourceUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`Remote server responded with HTTP status ${response.status}: ${response.statusText}`);
      }

      rawHtml = await response.text();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out after 15 seconds. The target website may be slow or blocking automated requests.');
      }
      throw new Error(`Failed to fetch article from ${sourceUrl}: ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!rawHtml || rawHtml.trim().length === 0) {
    throw new Error('Retrieved empty document content from source.');
  }

  const rawCharCount = rawHtml.length;

  // Initialize JSDOM
  const dom = new JSDOM(rawHtml, { url: sourceUrl });
  const doc = dom.window.document;

  // Resolve favicon
  let favicon: string | null = null;
  try {
    const iconEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    if (iconEl && iconEl.getAttribute('href')) {
      favicon = new URL(iconEl.getAttribute('href')!, sourceUrl).href;
    } else {
      favicon = new URL('/favicon.ico', sourceUrl).href;
    }
  } catch {
    favicon = null;
  }

  // Pre-strip known advertising, tracking, cookies, navigation tags
  let tagsStrippedCount = 0;
  for (const selector of NOISE_SELECTORS) {
    try {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        el.remove();
        tagsStrippedCount++;
      });
    } catch {
      // Ignore selector syntax issues if any
    }
  }

  // Resolve all relative links and image paths to absolute URLs
  doc.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      try {
        a.setAttribute('href', new URL(href, sourceUrl).href);
      } catch {
        // Keep original if invalid
      }
    }
  });

  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-original');
    if (src) {
      try {
        img.setAttribute('src', new URL(src, sourceUrl).href);
      } catch {
        // Keep original
      }
    }
  });

  // Check custom selector if provided
  let targetNode: Element | null = null;
  if (options.customSelector) {
    targetNode = doc.querySelector(options.customSelector);
  }

  // Execute Mozilla Readability
  let article: ReturnType<Readability['parse']> = null;
  try {
    const reader = new Readability(doc, {
      charThreshold: 60,
      classesToPreserve: ['highlight', 'code', 'table'],
    });
    article = reader.parse();
  } catch (e) {
    console.warn('Readability parse warning:', e);
  }

  // Fallbacks if Readability didn't locate article
  let articleContentHtml = '';
  let articleTitle = doc.title || 'Untitled Document';
  let articleAuthor: string | null = null;
  let articleExcerpt: string | null = null;
  let siteName: string | null = null;
  let publishedTime: string | null = null;

  if (article && article.content) {
    articleContentHtml = article.content;
    articleTitle = article.title || articleTitle;
    articleAuthor = article.byline || null;
    articleExcerpt = article.excerpt || null;
    siteName = article.siteName || null;
    publishedTime = article.publishedTime || null;
  } else if (targetNode) {
    articleContentHtml = targetNode.innerHTML;
  } else {
    // Standard tag fallbacks
    const candidate =
      doc.querySelector('article') ||
      doc.querySelector('main') ||
      doc.querySelector('[role="main"]') ||
      doc.querySelector('.post-content') ||
      doc.querySelector('.article-body') ||
      doc.querySelector('.entry-content') ||
      doc.body;

    articleContentHtml = candidate ? candidate.innerHTML : rawHtml;
  }

  // Re-parse extracted article HTML to sanitize and prepare for markdown / Notion
  const cleanDom = new JSDOM(`<!DOCTYPE html><html><body>${articleContentHtml}</body></html>`, { url: sourceUrl });
  const cleanDoc = cleanDom.window.document;

  // Apply user options
  if (options.preserveImages === false) {
    cleanDoc.querySelectorAll('img, picture, figure').forEach(el => el.remove());
  }

  if (options.preserveTables === false) {
    cleanDoc.querySelectorAll('table').forEach(el => el.remove());
  }

  if (options.preserveLinks === false) {
    cleanDoc.querySelectorAll('a').forEach(a => {
      const text = a.textContent || '';
      const textNode = cleanDoc.createTextNode(text);
      a.replaceWith(textNode);
    });
  }

  // Extract counts
  const imagesFound = cleanDoc.querySelectorAll('img').length;
  const linksFound = cleanDoc.querySelectorAll('a').length;

  // Configure Turndown for structured Markdown conversion
  const turndown = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });

  // Enable GFM plugin for tables, strikethrough, task lists
  try {
    turndown.use(gfm);
  } catch (e) {
    console.warn('Could not load turndown gfm plugin:', e);
  }

  // Custom rule to clean up empty paragraphs or div clutter
  turndown.addRule('cleanBreaks', {
    filter: ['br'],
    replacement: function () {
      return '\n';
    },
  });

  // Generate Markdown
  let markdownBody = turndown.turndown(cleanDoc.body.innerHTML);

  // Clean excessive blank lines (more than 2 consecutive newlines)
  markdownBody = markdownBody.replace(/\n{3,}/g, '\n\n').trim();

  // Calculate metadata & word stats
  const textContent = cleanDoc.body.textContent || '';
  const words = textContent.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Build Frontmatter / Metadata Header if requested
  let fullMarkdown = '';
  if (options.includeMetadata !== false) {
    const metaLines: string[] = ['---'];
    metaLines.push(`title: "${articleTitle.replace(/"/g, '\\"')}"`);
    if (articleAuthor) metaLines.push(`author: "${articleAuthor.replace(/"/g, '\\"')}"`);
    if (siteName) metaLines.push(`source: "${siteName.replace(/"/g, '\\"')}"`);
    if (sourceUrl && !sourceUrl.startsWith('https://local-upload')) {
      metaLines.push(`url: "${sourceUrl}"`);
    }
    if (publishedTime) metaLines.push(`date: "${publishedTime}"`);
    metaLines.push(`read_time: "${readTimeMinutes} min"`);
    metaLines.push(`words: ${wordCount}`);
    metaLines.push('---');
    metaLines.push('');
    metaLines.push(`# ${articleTitle}`);
    metaLines.push('');
    if (articleExcerpt) {
      metaLines.push(`> ${articleExcerpt}`);
      metaLines.push('');
    }
    fullMarkdown = `${metaLines.join('\n')}\n${markdownBody}`;
  } else {
    fullMarkdown = `# ${articleTitle}\n\n${markdownBody}`;
  }

  // Generate Notion Blocks
  const notionBlocks = htmlToNotionBlocks(cleanDoc.body);

  // If metadata is included, prepend a Notion Callout Block for metadata
  if (options.includeMetadata !== false) {
    const metaCallout: NotionBlock = {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `Source: ${siteName || 'Web Article'} • ${readTimeMinutes} min read • ${wordCount} words\nOriginal: `,
            },
            annotations: { bold: false, italic: true, strikethrough: false, underline: false, code: false, color: 'gray' },
            plain_text: `Source: ${siteName || 'Web Article'} • ${readTimeMinutes} min read • ${wordCount} words\nOriginal: `,
          },
          {
            type: 'text',
            text: {
              content: sourceUrl,
              link: { url: sourceUrl },
            },
            annotations: { bold: false, italic: false, strikethrough: false, underline: true, code: false, color: 'blue' },
            plain_text: sourceUrl,
            href: sourceUrl,
          },
        ],
        icon: { type: 'emoji', emoji: '📰' },
        color: 'gray_background',
      },
    };

    const titleBlock: NotionBlock = {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [
          {
            type: 'text',
            text: { content: articleTitle },
            annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: articleTitle,
          },
        ],
        color: 'default',
        is_toggleable: false,
      },
    };

    notionBlocks.unshift(titleBlock, metaCallout, { object: 'block', type: 'divider', divider: {} });
  }

  const cleanedCharCount = fullMarkdown.length;
  const reductionPercentage = Math.round(((rawCharCount - cleanedCharCount) / rawCharCount) * 100);

  return {
    metadata: {
      title: articleTitle,
      author: articleAuthor,
      publishedTime,
      siteName,
      excerpt: articleExcerpt,
      url: sourceUrl,
      favicon,
      wordCount,
      readTimeMinutes,
    },
    markdown: fullMarkdown,
    notionBlocks,
    cleanedHtml: cleanDoc.body.innerHTML,
    stats: {
      rawCharCount,
      cleanedCharCount,
      reductionPercentage: Math.max(0, reductionPercentage),
      tagsStrippedCount,
      imagesFound,
      linksFound,
    },
    notionClipboardHtml: generateNotionClipboardHtml(articleTitle, cleanDoc.body.innerHTML, sourceUrl),
  };
}

/**
 * Creates HTML formatted specifically for pasting into Notion with preserved block semantics
 */
function generateNotionClipboardHtml(title: string, bodyHtml: string, url: string): string {
  return `
    <div data-notion-page="true">
      <h1>${title}</h1>
      <p><em>Source: <a href="${url}">${url}</a></em></p>
      <hr />
      ${bodyHtml}
    </div>
  `.trim();
}
