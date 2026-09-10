import React from 'react';
import { NotionBlock, NotionRichText } from '../types';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface NotionViewProps {
  blocks: NotionBlock[];
  title: string;
  sourceUrl?: string;
  author?: string | null;
  readTimeMinutes?: number;
}

export const NotionView: React.FC<NotionViewProps> = ({
  blocks,
  title,
  sourceUrl,
  author,
  readTimeMinutes,
}) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8 bg-white dark:bg-zinc-900 min-h-full font-sans text-zinc-900 dark:text-zinc-100 selection:bg-indigo-100 dark:selection:bg-indigo-950">
      {/* Notion Page Header Decoration */}
      <div className="mb-6">
        <div className="text-4xl mb-3 select-none">📰</div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>

        {/* Notion Properties Block */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          {sourceUrl && !sourceUrl.startsWith('https://local-upload') && (
            <div className="flex items-center gap-3">
              <span className="w-20 text-zinc-400 font-medium">Source URL</span>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
              >
                <span>{sourceUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
          {author && (
            <div className="flex items-center gap-3">
              <span className="w-20 text-zinc-400 font-medium">Author</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{author}</span>
            </div>
          )}
          {readTimeMinutes && (
            <div className="flex items-center gap-3">
              <span className="w-20 text-zinc-400 font-medium">Read Time</span>
              <span>{readTimeMinutes} minutes</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-6" />

      {/* Render Notion Blocks */}
      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <NotionBlockItem key={idx} block={block} />
        ))}
      </div>
    </div>
  );
};

const NotionBlockItem: React.FC<{ block: NotionBlock }> = ({ block }) => {
  const [copiedCode, setCopiedCode] = React.useState(false);

  switch (block.type) {
    case 'heading_1':
      return (
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-2 tracking-tight">
          <RenderRichText items={block.heading_1?.rich_text} />
        </h1>
      );

    case 'heading_2':
      return (
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-2 tracking-tight">
          <RenderRichText items={block.heading_2?.rich_text} />
        </h2>
      );

    case 'heading_3':
      return (
        <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-4 mb-1">
          <RenderRichText items={block.heading_3?.rich_text} />
        </h3>
      );

    case 'paragraph':
      return (
        <p className="text-sm sm:text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
          <RenderRichText items={block.paragraph?.rich_text} />
        </p>
      );

    case 'bulleted_list_item':
      return (
        <div className="flex items-start gap-2 text-sm sm:text-base text-zinc-800 dark:text-zinc-200 pl-2">
          <span className="text-zinc-400 select-none text-base leading-none mt-1.5">•</span>
          <div className="flex-1 leading-relaxed">
            <RenderRichText items={block.bulleted_list_item?.rich_text} />
          </div>
        </div>
      );

    case 'numbered_list_item':
      return (
        <div className="flex items-start gap-2 text-sm sm:text-base text-zinc-800 dark:text-zinc-200 pl-2">
          <span className="text-zinc-400 select-none font-mono text-xs mt-1">1.</span>
          <div className="flex-1 leading-relaxed">
            <RenderRichText items={block.numbered_list_item?.rich_text} />
          </div>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-3 border-zinc-900 dark:border-zinc-100 pl-4 py-1 text-sm sm:text-base italic text-zinc-700 dark:text-zinc-300 my-3">
          <RenderRichText items={block.quote?.rich_text} />
        </blockquote>
      );

    case 'callout':
      return (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 my-3 text-sm">
          <span className="text-lg select-none">{block.callout?.icon?.emoji || '💡'}</span>
          <div className="flex-1 leading-relaxed text-zinc-800 dark:text-zinc-200">
            <RenderRichText items={block.callout?.rich_text} />
          </div>
        </div>
      );

    case 'code':
      const codeText = block.code?.rich_text?.map((r: NotionRichText) => r.text?.content || '').join('') || '';
      return (
        <div className="my-4 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xs">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-800/80 border-b border-zinc-800 text-zinc-400 text-[11px]">
            <span>{block.code?.language || 'plaintext'}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(codeText);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 1500);
              }}
              className="flex items-center gap-1 hover:text-zinc-100 transition-colors"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto leading-relaxed">
            <code>{codeText}</code>
          </pre>
        </div>
      );

    case 'divider':
      return <hr className="my-5 border-zinc-200 dark:border-zinc-800" />;

    case 'image':
      const imgUrl = block.image?.external?.url || block.image?.file?.url;
      const caption = block.image?.caption?.map((c: NotionRichText) => c.text?.content || '').join('');
      return (
        <figure className="my-4">
          <img
            src={imgUrl}
            alt={caption || 'Notion image'}
            className="rounded-xl max-h-96 w-auto max-w-full mx-auto border border-zinc-200 dark:border-zinc-800 object-contain shadow-xs"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {caption && (
            <figcaption className="text-center text-xs text-zinc-400 mt-1.5 italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );

    case 'table':
      return (
        <div className="my-4 overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <table className="min-w-full text-xs sm:text-sm divide-y divide-zinc-200 dark:divide-zinc-800">
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {block.table?.children?.map((row: NotionBlock, rIdx: number) => (
                <tr key={rIdx} className={rIdx === 0 && block.table?.has_column_header ? 'bg-zinc-50 dark:bg-zinc-800 font-semibold' : ''}>
                  {row.table_row?.cells?.map((cell: NotionRichText[], cIdx: number) => (
                    <td key={cIdx} className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 last:border-none">
                      <RenderRichText items={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
};

const RenderRichText: React.FC<{ items?: NotionRichText[] }> = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <>
      {items.map((item, i) => {
        const text = item.text?.content || '';
        const annotations = item.annotations;

        let content: React.ReactNode = text;

        if (annotations?.code) {
          content = (
            <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[0.85em] text-rose-600 dark:text-rose-400">
              {content}
            </code>
          );
        }
        if (annotations?.bold) content = <strong>{content}</strong>;
        if (annotations?.italic) content = <em>{content}</em>;
        if (annotations?.strikethrough) content = <s>{content}</s>;
        if (annotations?.underline) content = <u>{content}</u>;

        if (item.text?.link?.url) {
          content = (
            <a
              href={item.text.link.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {content}
            </a>
          );
        }

        return <React.Fragment key={i}>{content}</React.Fragment>;
      })}
    </>
  );
};
