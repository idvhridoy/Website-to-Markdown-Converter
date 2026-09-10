/**
 * Notion Block Converter
 * Generates Notion Block API compatible JSON structures and Notion-friendly clipboard HTML
 */

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

export function createRichText(text: string, options: { bold?: boolean; italic?: boolean; code?: boolean; href?: string } = {}): NotionRichText[] {
  if (!text) return [];
  // Split into chunks if > 2000 chars (Notion max rich_text length is 2000)
  const chunks = text.match(/.{1,1900}/g) || [text];
  return chunks.map(chunk => ({
    type: 'text',
    text: {
      content: chunk,
      link: options.href ? { url: options.href } : null,
    },
    annotations: {
      bold: !!options.bold,
      italic: !!options.italic,
      strikethrough: false,
      underline: false,
      code: !!options.code,
      color: 'default',
    },
    plain_text: chunk,
    href: options.href || null,
  }));
}

/**
 * Parses an HTML element tree into Notion Block structures
 */
export function htmlToNotionBlocks(rootElement: Element): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  for (const node of Array.from(rootElement.children)) {
    const tagName = node.tagName.toLowerCase();
    const textContent = node.textContent?.trim() || '';

    switch (tagName) {
      case 'h1':
        if (textContent) {
          blocks.push({
            object: 'block',
            type: 'heading_1',
            heading_1: {
              rich_text: createRichText(textContent),
              color: 'default',
              is_toggleable: false,
            },
          });
        }
        break;

      case 'h2':
        if (textContent) {
          blocks.push({
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: createRichText(textContent),
              color: 'default',
              is_toggleable: false,
            },
          });
        }
        break;

      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (textContent) {
          blocks.push({
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: createRichText(textContent),
              color: 'default',
              is_toggleable: false,
            },
          });
        }
        break;

      case 'p':
        if (textContent) {
          // Check if it's just an image wrapped in a p
          const img = node.querySelector('img');
          if (img && !textContent) {
            const src = img.getAttribute('src');
            if (src && (src.startsWith('http') || src.startsWith('data:'))) {
              blocks.push({
                object: 'block',
                type: 'image',
                image: {
                  type: 'external',
                  external: { url: src },
                  caption: img.getAttribute('alt') ? createRichText(img.getAttribute('alt')!) : [],
                },
              });
              break;
            }
          }

          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: extractRichTextFromElement(node),
              color: 'default',
            },
          });
        }
        break;

      case 'ul':
        for (const li of Array.from(node.querySelectorAll(':scope > li'))) {
          const liText = li.textContent?.trim() || '';
          if (liText) {
            blocks.push({
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: extractRichTextFromElement(li),
                color: 'default',
              },
            });
          }
        }
        break;

      case 'ol':
        for (const li of Array.from(node.querySelectorAll(':scope > li'))) {
          const liText = li.textContent?.trim() || '';
          if (liText) {
            blocks.push({
              object: 'block',
              type: 'numbered_list_item',
              numbered_list_item: {
                rich_text: extractRichTextFromElement(li),
                color: 'default',
              },
            });
          }
        }
        break;

      case 'blockquote':
        if (textContent) {
          blocks.push({
            object: 'block',
            type: 'quote',
            quote: {
              rich_text: extractRichTextFromElement(node),
              color: 'default',
            },
          });
        }
        break;

      case 'pre':
      case 'code':
        const codeEl = node.tagName.toLowerCase() === 'pre' ? (node.querySelector('code') || node) : node;
        const rawCode = codeEl.textContent || '';
        const classNames = codeEl.getAttribute('class') || '';
        const langMatch = classNames.match(/language-(\w+)/i);
        const language = langMatch ? langMatch[1].toLowerCase() : 'plain text';

        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            caption: [],
            rich_text: createRichText(rawCode.trim()),
            language: normalizeNotionLanguage(language),
          },
        });
        break;

      case 'hr':
        blocks.push({
          object: 'block',
          type: 'divider',
          divider: {},
        });
        break;

      case 'img':
        const src = node.getAttribute('src');
        if (src && (src.startsWith('http') || src.startsWith('data:'))) {
          blocks.push({
            object: 'block',
            type: 'image',
            image: {
              type: 'external',
              external: { url: src },
              caption: node.getAttribute('alt') ? createRichText(node.getAttribute('alt')!) : [],
            },
          });
        }
        break;

      case 'table':
        const rows = Array.from(node.querySelectorAll('tr'));
        if (rows.length > 0) {
          const maxCols = Math.max(...rows.map(r => r.querySelectorAll('th, td').length), 1);
          const tableChildren: NotionBlock[] = [];

          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('th, td'));
            const rowCells: NotionRichText[][] = [];
            for (let c = 0; c < maxCols; c++) {
              const cell = cells[c];
              rowCells.push(cell ? extractRichTextFromElement(cell) : []);
            }

            tableChildren.push({
              object: 'block',
              type: 'table_row',
              table_row: {
                cells: rowCells,
              },
            });
          }

          blocks.push({
            object: 'block',
            type: 'table',
            table: {
              table_width: maxCols,
              has_column_header: !!node.querySelector('th'),
              has_row_header: false,
              children: tableChildren,
            },
          });
        }
        break;

      case 'figure':
        const figureImg = node.querySelector('img');
        const captionEl = node.querySelector('figcaption');
        if (figureImg) {
          const fSrc = figureImg.getAttribute('src');
          if (fSrc && (fSrc.startsWith('http') || fSrc.startsWith('data:'))) {
            blocks.push({
              object: 'block',
              type: 'image',
              image: {
                type: 'external',
                external: { url: fSrc },
                caption: captionEl ? extractRichTextFromElement(captionEl) : [],
              },
            });
          }
        }
        break;

      default:
        // Generic container, if contains nested text or elements
        if (node.children.length > 0) {
          const subBlocks = htmlToNotionBlocks(node);
          blocks.push(...subBlocks);
        } else if (textContent) {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: createRichText(textContent),
              color: 'default',
            },
          });
        }
        break;
    }
  }

  return blocks;
}

function extractRichTextFromElement(el: Element): NotionRichText[] {
  const result: NotionRichText[] = [];

  function walk(node: Node, currentMarks: { bold: boolean; italic: boolean; code: boolean; href?: string }) {
    if (node.nodeType === 3) {
      // Text node
      const text = node.textContent || '';
      if (text) {
        result.push({
          type: 'text',
          text: {
            content: text,
            link: currentMarks.href ? { url: currentMarks.href } : null,
          },
          annotations: {
            bold: currentMarks.bold,
            italic: currentMarks.italic,
            strikethrough: false,
            underline: false,
            code: currentMarks.code,
            color: 'default',
          },
          plain_text: text,
          href: currentMarks.href || null,
        });
      }
      return;
    }

    if (node.nodeType === 1) {
      const element = node as Element;
      const tag = element.tagName.toLowerCase();
      const newMarks = { ...currentMarks };

      if (tag === 'b' || tag === 'strong') newMarks.bold = true;
      if (tag === 'i' || tag === 'em') newMarks.italic = true;
      if (tag === 'code') newMarks.code = true;
      if (tag === 'a') {
        const href = element.getAttribute('href');
        if (href) newMarks.href = href;
      }

      for (const child of Array.from(element.childNodes)) {
        walk(child, newMarks);
      }
    }
  }

  walk(el, { bold: false, italic: false, code: false });
  return result.length > 0 ? result : createRichText(el.textContent || '');
}

function normalizeNotionLanguage(lang: string): string {
  const supported = [
    'abap', 'arduino', 'bash', 'basic', 'c', 'clojure', 'coffeescript', 'c++', 'c#',
    'css', 'dart', 'diff', 'docker', 'elixir', 'elm', 'erlang', 'flow', 'fortran',
    'f#', 'gherkin', 'glsl', 'go', 'graphql', 'groovy', 'haskell', 'html', 'java',
    'javascript', 'json', 'julia', 'kotlin', 'latex', 'less', 'lisp', 'livescript',
    'lua', 'makefile', 'markdown', 'markup', 'matlab', 'mermaid', 'nix', 'objective-c',
    'ocaml', 'pascal', 'perl', 'php', 'plain text', 'powershell', 'prolog', 'protobuf',
    'python', 'r', 'reason', 'ruby', 'rust', 'sass', 'scala', 'scheme', 'scss',
    'shell', 'sql', 'swift', 'typescript', 'vb.net', 'verilog', 'vhdl', 'visual basic',
    'webassembly', 'xml', 'yaml', 'java/c/c++/c#'
  ];
  if (supported.includes(lang)) return lang;
  if (lang === 'js') return 'javascript';
  if (lang === 'ts') return 'typescript';
  if (lang === 'py') return 'python';
  if (lang === 'sh') return 'bash';
  return 'plain text';
}
