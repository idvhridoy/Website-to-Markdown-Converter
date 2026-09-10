import { ScrapeResult } from '../types';

export const INITIAL_SAMPLE_RESULT: ScrapeResult = {
  metadata: {
    title: 'The Architecture of Clean Web Extraction: Stripping Noise, Preserving Signal',
    author: 'Elena Rostova',
    publishedTime: '2026-04-12T14:30:00Z',
    siteName: 'Distributed Systems & Web Engines',
    excerpt: 'How modern reader modes isolate core editorial prose from megabytes of advertising scripts, sticky navigation headers, and telemetry trackers.',
    url: 'https://distributedsystems.dev/clean-web-extraction-architecture',
    favicon: 'https://distributedsystems.dev/favicon.ico',
    wordCount: 840,
    readTimeMinutes: 4,
  },
  markdown: `---
title: "The Architecture of Clean Web Extraction: Stripping Noise, Preserving Signal"
author: "Elena Rostova"
source: "Distributed Systems & Web Engines"
url: "https://distributedsystems.dev/clean-web-extraction-architecture"
date: "2026-04-12T14:30:00Z"
read_time: "4 min"
words: 840
---

# The Architecture of Clean Web Extraction: Stripping Noise, Preserving Signal

> How modern reader modes isolate core editorial prose from megabytes of advertising scripts, sticky navigation headers, and telemetry trackers.

The contemporary web document is no longer a static hypertext page. On average, a mainstream publication page delivers **3.8 megabytes** of JavaScript, CSS, tag managers, and ad networks for just **15 kilobytes** of genuine prose. 

When extracting articles for local knowledge bases like **Obsidian**, personal archives, or **Notion workspaces**, extracting clean, structured content requires a disciplined multi-stage heuristic pipeline.

## 1. The Heuristic Stripping Pipeline

The ingestion engine executes in a sandboxed Node.js or browser worker environment, evaluating document nodes through a four-phase filter:

| Stage | Target Artefacts | Typical Payload Reduction |
| :--- | :--- | :--- |
| **Phase 1: Script Purge** | \`<script>\`, \`<noscript>\`, \`<style>\`, third-party iframes | 62% to 75% |
| **Phase 2: Semantic Pruning** | \`<nav>\`, \`<aside>\`, \`<footer>\`, banner popups | 12% to 18% |
| **Phase 3: Density Scoring** | Text-to-tag ratio heuristics (Readability) | 8% to 15% |
| **Phase 4: AST Normalization** | DOM to GFM Markdown & Notion Block AST | Pure content (100% Signal) |

## 2. Converting DOM to Notion Blocks

Unlike flat Markdown, Notion's block engine models content as discrete polymorphic objects with independent rich-text annotations.

\`\`\`typescript
interface NotionParagraphBlock {
  object: "block";
  type: "paragraph";
  paragraph: {
    rich_text: Array<{
      type: "text";
      text: { content: string; link: { url: string } | null };
      annotations: {
        bold: boolean;
        italic: boolean;
        code: boolean;
      };
    }>;
    color: "default";
  };
}
\`\`\`

### Key Extraction Principles

1. **Relative Path Resolution**: Never output relative URLs (\`/images/diagram.png\`). Always resolve them against the host origin before serialization.
2. **Table Preservation**: Keep GitHub-Flavored Markdown tables intact with explicit header delimiters (\`| --- |\`).
3. **Safe Fallback**: When readability metrics detect non-standard single-page apps, gracefully fallback to the largest semantic container.
4. **Zero Cloud Residue**: All scraping and processing occurs entirely in ephemeral memory, guaranteeing total user privacy.

> "A document is not complete when there is nothing more to add, but when there is nothing left to take away."
`,
  notionBlocks: [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'The Architecture of Clean Web Extraction: Stripping Noise, Preserving Signal' },
            annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: 'The Architecture of Clean Web Extraction: Stripping Noise, Preserving Signal',
          },
        ],
        color: 'default',
        is_toggleable: false,
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Source: Distributed Systems & Web Engines • 4 min read • 840 words\nOriginal: ' },
            annotations: { bold: false, italic: true, strikethrough: false, underline: false, code: false, color: 'gray' },
            plain_text: 'Source: Distributed Systems & Web Engines • 4 min read • 840 words\nOriginal: ',
          },
          {
            type: 'text',
            text: { content: 'https://distributedsystems.dev/clean-web-extraction-architecture', link: { url: 'https://distributedsystems.dev/clean-web-extraction-architecture' } },
            annotations: { bold: false, italic: false, strikethrough: false, underline: true, code: false, color: 'blue' },
            plain_text: 'https://distributedsystems.dev/clean-web-extraction-architecture',
            href: 'https://distributedsystems.dev/clean-web-extraction-architecture',
          },
        ],
        icon: { type: 'emoji', emoji: '📰' },
        color: 'gray_background',
      },
    },
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'quote',
      quote: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'How modern reader modes isolate core editorial prose from megabytes of advertising scripts, sticky navigation headers, and telemetry trackers.' },
            annotations: { bold: false, italic: true, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: 'How modern reader modes isolate core editorial prose from megabytes of advertising scripts, sticky navigation headers, and telemetry trackers.',
          },
        ],
        color: 'default',
      },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'The contemporary web document is no longer a static hypertext page. On average, a mainstream publication page delivers ' },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: 'The contemporary web document is no longer a static hypertext page. On average, a mainstream publication page delivers ',
          },
          {
            type: 'text',
            text: { content: '3.8 megabytes' },
            annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: '3.8 megabytes',
          },
          {
            type: 'text',
            text: { content: ' of JavaScript, CSS, tag managers, and ad networks for just ' },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: ' of JavaScript, CSS, tag managers, and ad networks for just ',
          },
          {
            type: 'text',
            text: { content: '15 kilobytes' },
            annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: '15 kilobytes',
          },
          {
            type: 'text',
            text: { content: ' of genuine prose.' },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: ' of genuine prose.',
          },
        ],
        color: 'default',
      },
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: { content: '1. The Heuristic Stripping Pipeline' },
            annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: '1. The Heuristic Stripping Pipeline',
          },
        ],
        color: 'default',
        is_toggleable: false,
      },
    },
    {
      object: 'block',
      type: 'code',
      code: {
        caption: [],
        rich_text: [
          {
            type: 'text',
            text: {
              content: `interface NotionParagraphBlock {
  object: "block";
  type: "paragraph";
  paragraph: {
    rich_text: Array<{
      type: "text";
      text: { content: string; link: { url: string } | null };
      annotations: {
        bold: boolean;
        italic: boolean;
        code: boolean;
      };
    }>;
    color: "default";
  };
}`,
            },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: `interface NotionParagraphBlock {...}`,
          },
        ],
        language: 'typescript',
      },
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Key Extraction Principles' },
            annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: 'Key Extraction Principles',
          },
        ],
        color: 'default',
        is_toggleable: false,
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Relative Path Resolution: Never output relative URLs (/images/foo.png). Always resolve against source origin.' },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: 'Relative Path Resolution: Never output relative URLs (/images/foo.png). Always resolve against source origin.',
          },
        ],
        color: 'default',
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Table Preservation: Keep GFM tables intact with standard pipe syntax and column alignment headers.' },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: 'Table Preservation: Keep GFM tables intact with standard pipe syntax and column alignment headers.',
          },
        ],
        color: 'default',
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Zero Cloud Residue: All scraping and processing occurs entirely in ephemeral memory, protecting data privacy.' },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
            plain_text: 'Zero Cloud Residue: All scraping and processing occurs entirely in ephemeral memory, protecting data privacy.',
          },
        ],
        color: 'default',
      },
    },
  ],
  cleanedHtml: `
    <h1>The Architecture of Clean Web Extraction: Stripping Noise, Preserving Signal</h1>
    <blockquote>How modern reader modes isolate core editorial prose from megabytes of advertising scripts, sticky navigation headers, and telemetry trackers.</blockquote>
    <p>The contemporary web document is no longer a static hypertext page. On average, a mainstream publication page delivers <strong>3.8 megabytes</strong> of JavaScript, CSS, tag managers, and ad networks for just <strong>15 kilobytes</strong> of genuine prose.</p>
    <h2>1. The Heuristic Stripping Pipeline</h2>
    <p>The ingestion engine executes in a sandboxed Node.js environment, evaluating document nodes through a four-phase filter.</p>
    <h2>Key Extraction Principles</h2>
    <ul>
      <li>Relative Path Resolution: Never output relative URLs.</li>
      <li>Table Preservation: Keep GFM tables intact.</li>
      <li>Zero Cloud Residue: All scraping occurs in ephemeral memory.</li>
    </ul>
  `,
  stats: {
    rawCharCount: 142800,
    cleanedCharCount: 2190,
    reductionPercentage: 98,
    tagsStrippedCount: 84,
    imagesFound: 2,
    linksFound: 6,
  },
  notionClipboardHtml: `
    <div data-notion-page="true">
      <h1>The Architecture of Clean Web Extraction: Stripping Noise, Preserving Signal</h1>
      <p><em>Source: <a href="https://distributedsystems.dev/clean-web-extraction-architecture">Distributed Systems & Web Engines</a></em></p>
      <hr />
      <p>How modern reader modes isolate core editorial prose from megabytes of advertising scripts.</p>
    </div>
  `,
};
