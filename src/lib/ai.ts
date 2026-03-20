import Anthropic from "@anthropic-ai/sdk";

interface Entry {
  id: string;
  content: string;
  category: string;
  tags: string;
  localDate: string;
  localTime: string;
  createdAt: Date;
}

export interface AIWeeklyBrief {
  patterns: string[];
  ripeDecisions: string[];
  conversationsToHave: string[];
  thingsToLetGo: string[];
  prioritizedActions: string[];
}

export interface AIMonthlyReview {
  topFocusAreas: { topic: string; count: number }[];
  keyDecisions: string[];
  circlingThemes: string[];
  shiftedTopics: string[];
  reflection: string;
}

function formatEntries(entries: Entry[]): string {
  return entries
    .map(
      (e) =>
        `[${e.localDate} ${e.localTime}] (${e.category}) ${e.content}`
    )
    .join("\n\n");
}

export async function generateWeeklyBrief(
  entries: Entry[]
): Promise<AIWeeklyBrief | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const formatted = formatEntries(entries);

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are analyzing a personal journal. Here are the entries from the past 7 days. Each entry has a category: spore (quick thought), root (deep reflection), signal (reminder/rule), decompose (letting go), fruit (action/decision).

${formatted}

Analyze these entries and return a JSON object with exactly these keys:
- "patterns": array of 2-4 strings describing patterns across the thoughts
- "ripeDecisions": array of 1-3 strings describing decisions that seem ready to be made (mentioned repeatedly, emotionally loaded)
- "conversationsToHave": array of 1-3 strings about conversations being avoided or needed
- "thingsToLetGo": array of 1-3 strings about things worth releasing
- "prioritizedActions": array of exactly 3 strings — concrete actions prioritized for the week

Be concise, direct, and insightful. Each string should be 1-2 sentences max. Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);
    return parsed as AIWeeklyBrief;
  } catch {
    return null;
  }
}

export async function autoCorrect(rawText: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return rawText;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Fix all spelling, grammar, and typo errors in this text. Keep the original meaning, tone, and style exactly the same. Do not add punctuation that wasn't intended. Do not make it more formal. Do not add or remove ideas. Just clean up the language so it reads clearly.

If the text is already clean, return it unchanged.

Return ONLY the corrected text, nothing else.

Text: ${rawText}`,
        },
      ],
    });

    const corrected =
      message.content[0].type === "text" ? message.content[0].text.trim() : rawText;
    return corrected || rawText;
  } catch {
    return rawText;
  }
}

export interface VideoAnalysis {
  title: string;
  summary: string;
  keyTakeaways: string[];
  actionItems: string[];
  relevantTopics: string[];
}

export async function analyzeVideoTranscript(
  transcript: string,
  videoTitle: string,
  userNote?: string
): Promise<VideoAnalysis | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    // Truncate transcript to ~12k chars to stay within limits
    const trimmed = transcript.slice(0, 12000);

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Analyze this YouTube video transcript and extract what's personally useful and actionable.${userNote ? `\n\nThe user's intent: "${userNote}"` : ""}

Video title: ${videoTitle}

Transcript:
${trimmed}

${userNote ? `Focus your analysis through the lens of the user's intent: "${userNote}". Tailor takeaways and actions to serve that purpose.\n\n` : ""}Return a JSON object with exactly these keys:
- "summary": 2-3 sentence summary of the core message
- "keyTakeaways": array of 3-5 strings — the most valuable insights
- "actionItems": array of 1-3 strings — concrete things I could do based on this
- "relevantTopics": array of 1-4 strings from this list ONLY: health, money, retirement, housing, family, career, relationships, growth, creativity, travel

Be direct and practical. Focus on what's actionable, not just interesting. Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return { title: videoTitle, ...JSON.parse(text) } as VideoAnalysis;
  } catch {
    return null;
  }
}

export async function generateMonthlyReview(
  entries: Entry[]
): Promise<AIMonthlyReview | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const formatted = formatEntries(entries);

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are analyzing a personal journal. Here are entries from the past 30 days. Categories: spore (thought), root (reflection), signal (reminder), decompose (letting go), fruit (action/decision). Tags indicate life topics.

${formatted}

Analyze and return a JSON object with exactly these keys:
- "topFocusAreas": array of objects {topic: string, count: number} — top 5 life areas by attention
- "keyDecisions": array of 2-5 strings — major decisions/actions taken (fruit entries)
- "circlingThemes": array of 2-4 strings — repeated themes without resolution
- "shiftedTopics": array of 1-3 strings — topics that appeared then stopped
- "reflection": a single paragraph (3-5 sentences) reflecting on the month's journey

Be concise and insightful. Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);
    return parsed as AIMonthlyReview;
  } catch {
    return null;
  }
}
