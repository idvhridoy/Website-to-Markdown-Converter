import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { fetchAndScrape, ScrapeOptions } from './server/scraper.js';
import { enhanceArticleWithAi } from './server/gemini.js';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Healthcheck endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Sample URLs for instant user testing
  app.get('/api/sample-urls', (req: Request, res: Response) => {
    res.json([
      {
        title: 'Wikipedia: Artificial Intelligence',
        url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
        category: 'Encyclopedia / Research',
        desc: 'Dense headings, tables, references, infoboxes, and citations.',
      },
      {
        title: 'MDN: Web Components Overview',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components',
        category: 'Technical Documentation',
        desc: 'Code snippets, API tables, breadcrumb links, and technical explanations.',
      },
      {
        title: 'BBC Tech: Breakthrough in Quantum Computing',
        url: 'https://www.bbc.com/news/technology',
        category: 'News Article',
        desc: 'Heavy ad slots, related links, navigation bars, and editorial body.',
      },
      {
        title: 'GitHub Blog: Engineering at Scale',
        url: 'https://github.blog/',
        category: 'Engineering Blog',
        desc: 'Rich media, author cards, inline code, and social share widgets.',
      },
    ]);
  });

  // Single URL or raw HTML scraping & conversion
  app.post('/api/scrape', async (req: Request, res: Response) => {
    try {
      const { url, html, options = {} } = req.body as {
        url?: string;
        html?: string;
        options?: ScrapeOptions;
      };

      if (!url && !html) {
        return res.status(400).json({
          error: 'Either a valid "url" or direct "html" must be provided in request body.',
        });
      }

      const isDirectHtml = Boolean(html && (!url || html.length > 50));
      const targetInput = isDirectHtml ? html! : url!;

      const result = await fetchAndScrape(targetInput, options, isDirectHtml);

      // If AI Enhancement is requested and Gemini is available
      if (options.enableAiClean && process.env.GEMINI_API_KEY) {
        try {
          const aiResult = await enhanceArticleWithAi(result.metadata.title, result.markdown);
          result.markdown = aiResult.enhancedMarkdown;
        } catch (aiErr: any) {
          console.warn('AI enhancement fallback:', aiErr.message);
          // Non-blocking: retain readability markdown
        }
      }

      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error('Scrape API error:', err);
      return res.status(err.message?.includes('Invalid URL') ? 400 : 500).json({
        error: err.message || 'An unexpected error occurred during scraping and conversion.',
      });
    }
  });

  // Batch Scraping endpoint for multiple URLs (with concurrency limit)
  app.post('/api/batch-scrape', async (req: Request, res: Response) => {
    try {
      const { urls, options = {} } = req.body as {
        urls: string[];
        options?: ScrapeOptions;
      };

      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'Please provide a non-empty array of URLs.' });
      }

      const sanitizedUrls = urls
        .map(u => (typeof u === 'string' ? u.trim() : ''))
        .filter(u => u.startsWith('http://') || u.startsWith('https://'))
        .slice(0, 10); // Cap at 10 for safety

      if (sanitizedUrls.length === 0) {
        return res.status(400).json({ error: 'No valid HTTP/HTTPS URLs found in batch request.' });
      }

      const results = await Promise.allSettled(
        sanitizedUrls.map(u => fetchAndScrape(u, options, false))
      );

      const payload = results.map((res, index) => {
        const targetUrl = sanitizedUrls[index];
        if (res.status === 'fulfilled') {
          return {
            url: targetUrl,
            status: 'success',
            data: res.value,
          };
        } else {
          return {
            url: targetUrl,
            status: 'error',
            error: res.reason?.message || 'Failed to scrape URL',
          };
        }
      });

      return res.json({
        success: true,
        count: payload.length,
        results: payload,
      });
    } catch (err: any) {
      console.error('Batch scrape API error:', err);
      return res.status(500).json({ error: err.message || 'Batch scrape operation failed.' });
    }
  });

  // AI Refine / Restructure standalone endpoint
  app.post('/api/ai-enhance', async (req: Request, res: Response) => {
    try {
      const { title, markdown } = req.body as { title: string; markdown: string };
      if (!markdown) {
        return res.status(400).json({ error: 'Markdown content is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: 'Gemini API key is not configured. Please configure GEMINI_API_KEY in environment secrets.',
        });
      }

      const result = await enhanceArticleWithAi(title || 'Article', markdown);
      return res.json({
        success: true,
        enhancedMarkdown: result.enhancedMarkdown,
      });
    } catch (err: any) {
      console.error('AI Enhance error:', err);
      return res.status(500).json({ error: err.message || 'AI processing failed.' });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scraper & Notion server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
