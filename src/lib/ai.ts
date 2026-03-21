import { GoogleGenerativeAI } from "@google/generative-ai";

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

export interface VideoAnalysis {
  title: string;
  summary: string;
  keyTakeaways: string[];
  actionItems: string[];
  relevantTopics: string[];
}

// ── Gemini client ────────────────────────────────────────────

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

async function ask(prompt: string): Promise<string | null> {
  const model = getModel();
  if (!model) return null;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    return null;
  }
}

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return cleaned;
}

// ── Helpers ──────────────────────────────────────────────────

function formatEntries(entries: Entry[]): string {
  return entries
    .map(
      (e) =>
        `[${e.localDate} ${e.localTime}] (${e.category}) ${e.content}`
    )
    .join("\n\n");
}

// ── Auto-correct ─────────────────────────────────────────────

export async function autoCorrect(rawText: string): Promise<string> {
  const result = await ask(
    `Fix all spelling, grammar, and typo errors in this text. Keep the original meaning, tone, and style exactly the same. Do not add punctuation that wasn't intended. Do not make it more formal. Do not add or remove ideas. Just clean up the language so it reads clearly.

If the text is already clean, return it unchanged.

Return ONLY the corrected text, nothing else. No quotes, no explanation.

Text: ${rawText}`
  );

  return result?.trim() || rawText;
}

// ── Weekly Brief ─────────────────────────────────────────────

export async function generateWeeklyBrief(
  entries: Entry[]
): Promise<AIWeeklyBrief | null> {
  if (entries.length === 0) return null;

  const formatted = formatEntries(entries);

  const result = await ask(
    `You are analyzing a personal journal. Here are the entries from the past 7 days. Each entry has a category: spore (quick thought), root (deep reflection), signal (reminder/rule), decompose (letting go), fruit (action/decision).

${formatted}

Analyze these entries and return a JSON object with exactly these keys:
- "patterns": array of 2-4 strings describing patterns across the thoughts
- "ripeDecisions": array of 1-3 strings describing decisions that seem ready to be made (mentioned repeatedly, emotionally loaded)
- "conversationsToHave": array of 1-3 strings about conversations being avoided or needed
- "thingsToLetGo": array of 1-3 strings about things worth releasing
- "prioritizedActions": array of exactly 3 strings — concrete actions prioritized for the week

Be concise, direct, and insightful. Each string should be 1-2 sentences max. Return ONLY valid JSON, no markdown.`
  );

  if (!result) return null;

  try {
    return JSON.parse(extractJSON(result)) as AIWeeklyBrief;
  } catch {
    return null;
  }
}

// ── Video Analysis ───────────────────────────────────────────

export async function analyzeVideoTranscript(
  transcript: string,
  videoTitle: string,
  userNote?: string
): Promise<VideoAnalysis | null> {
  const trimmed = transcript.slice(0, 12000);

  const result = await ask(
    `Analyze this YouTube video transcript and extract what's personally useful and actionable.${userNote ? `\n\nThe user's intent: "${userNote}"` : ""}

Video title: ${videoTitle}

Transcript:
${trimmed}

${userNote ? `Focus your analysis through the lens of the user's intent: "${userNote}". Tailor takeaways and actions to serve that purpose.\n\n` : ""}Return a JSON object with exactly these keys:
- "summary": 2-3 sentence summary of the core message
- "keyTakeaways": array of 3-5 strings — the most valuable insights
- "actionItems": array of 1-3 strings — concrete things I could do based on this
- "relevantTopics": array of 1-4 strings from this list ONLY: health, money, retirement, housing, family, career, relationships, growth, creativity, travel

Be direct and practical. Focus on what's actionable, not just interesting. Return ONLY valid JSON, no markdown.`
  );

  if (!result) return null;

  try {
    return { title: videoTitle, ...JSON.parse(extractJSON(result)) } as VideoAnalysis;
  } catch {
    return null;
  }
}

// ── Monthly Review ───────────────────────────────────────────

export async function generateMonthlyReview(
  entries: Entry[]
): Promise<AIMonthlyReview | null> {
  if (entries.length === 0) return null;

  const formatted = formatEntries(entries);

  const result = await ask(
    `You are analyzing a personal journal. Here are entries from the past 30 days. Categories: spore (thought), root (reflection), signal (reminder), decompose (letting go), fruit (action/decision). Tags indicate life topics.

${formatted}

Analyze and return a JSON object with exactly these keys:
- "topFocusAreas": array of objects {topic: string, count: number} — top 5 life areas by attention
- "keyDecisions": array of 2-5 strings — major decisions/actions taken (fruit entries)
- "circlingThemes": array of 2-4 strings — repeated themes without resolution
- "shiftedTopics": array of 1-3 strings — topics that appeared then stopped
- "reflection": a single paragraph (3-5 sentences) reflecting on the month's journey

Be concise and insightful. Return ONLY valid JSON, no markdown.`
  );

  if (!result) return null;

  try {
    return JSON.parse(extractJSON(result)) as AIMonthlyReview;
  } catch {
    return null;
  }
}
