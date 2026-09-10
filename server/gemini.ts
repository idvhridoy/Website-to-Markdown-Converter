import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function enhanceArticleWithAi(
  title: string,
  markdown: string,
  mode: 'full' | 'summary' | 'fix' = 'full'
): Promise<{ enhancedMarkdown: string; tldr?: string }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server. AI enhancement requires an API key.');
  }

  const prompt = `You are an elite editorial engineer and Notion/Markdown structuring expert.
You are given an article that was scraped from the web. Your job is to:
1. Strip any lingering promotional paragraphs, newsletter subscription asks, "Read next" lists, cookie reminders, or social widget artifacts that automated DOM strippers might have missed.
2. Ensure clear, beautifully structured Markdown with accurate heading hierarchy (# for Title, ## for Sections, ### for Subsections).
3. If code blocks or tables are present, preserve them faithfully.
4. Add a concise, punchy "## ⚡ Executive TL;DR" section at the top with 3-5 bullet points capturing the essence of the article.
5. Do NOT hallucinate content or delete substantive portions of the real article text. Maintain the author's original message and voice.

Article Title: ${title}

Raw Scraped Markdown Content:
\`\`\`markdown
${markdown.slice(0, 45000)}
\`\`\`

Respond ONLY with the polished, structured Markdown. Do not enclose your entire output in unnecessary conversational intros.`;

  const response = await client.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  });

  const text = response.text || markdown;
  return {
    enhancedMarkdown: text.trim(),
  };
}
