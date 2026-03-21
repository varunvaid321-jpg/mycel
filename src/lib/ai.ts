// Cloudflare Workers AI — free 10k requests/day
// Uses @cf/meta/llama-3.1-8b-instruct (fast, free)

// Personal context injected into every AI call so it understands who the user is
const SYSTEM_CONTEXT = `You are a helpful personal assistant for a private journal. Always respond with valid JSON when asked for JSON. No markdown formatting.

Key context about the journal owner:
- Lives in Canada (Toronto/Markham, Ontario) for 10 years. Canada is HOME, not a trip destination.
- Originally from India. References to India are about roots and family back home.
- Wife: Puja. Entries about Puja are marriage/partnership context.
- Son: Krish. Daughter: Kyna. They are his children, not colleagues or friends. Entries about Krish or Kyna are parenting moments.
- Works at GM (General Motors) since 2007 in infotainment engineering. Michigan office.
- "Office", "work", "GM" refer to his engineering career at General Motors.

- Currently looking to buy a home in Canada.
- Long-term financial vision: $75 million in cash. This is a serious goal, not a joke.
- Wants a happy home and family life.
- Goal: become a 100km marathon (ultra-marathon) runner.
- Core value: wants to be very friendly with everyone — kindness and good relationships matter deeply.
- Side projects: Orangutany (mushroom ID app), stock signal bot, this journal (Mycel).

IMPORTANT: Never interpret "Canada" as a trip or vacation. Never interpret Krish/Kyna as colleagues. Never interpret Puja as a friend. Understand the family and personal context when analyzing entries.`;

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

export interface WebAnalysis {
  title: string;
  summary: string;
  keyTakeaways: string[];
  actionItems: string[];
  relevantTopics: string[];
}

export interface GuideResponse {
  message: string;
  type: "insight" | "action" | "reflection" | "silent";
  intensity: "gentle" | "warm" | "direct";
}

// ── Cloudflare Workers AI client ─────────────────────────────

async function ask(prompt: string): Promise<string | null> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiKey = process.env.CF_AI_API_KEY;
  if (!accountId || !apiKey) return null;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_CONTEXT },
            { role: "user", content: prompt },
          ],
          max_tokens: 1500,
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.result?.response || null;
  } catch {
    return null;
  }
}

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  // Try to find JSON object in the text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : cleaned;
}

function formatEntries(entries: Entry[]): string {
  return entries
    .map(
      (e) =>
        `[${e.localDate} ${e.localTime}] (${e.category}) ${e.content}`
    )
    .join("\n\n");
}

// ── Intelligent Guide ────────────────────────────────────────

export async function generateGuide(
  entries: Entry[]
): Promise<GuideResponse | null> {
  if (entries.length < 2) return null;

  const formatted = formatEntries(entries.slice(0, 20));

  const result = await ask(
    `You are a thoughtful personal guide reading someone's private journal.

Entries:
${formatted}

Say ONE thing that matters right now. Return JSON:
{"message": "one sentence max 25 words", "type": "insight|action|reflection|silent", "intensity": "gentle|warm|direct"}

Rules: If recurring theme without resolution, name it. If they committed to something, remind warmly. If calm, return type "silent". Never preachy. Reference their specific words.`
  );

  if (!result) return null;
  try {
    return JSON.parse(extractJSON(result)) as GuideResponse;
  } catch {
    return null;
  }
}

// ── Auto-correct ─────────────────────────────────────────────

export async function autoCorrect(rawText: string): Promise<string> {
  const result = await ask(
    `Fix spelling, grammar, and typos. Keep original meaning and tone. Return ONLY the corrected text, nothing else.\n\nText: ${rawText}`
  );
  return result?.trim() || rawText;
}

// ── Weekly Brief ─────────────────────────────────────────────

export async function generateWeeklyBrief(
  entries: Entry[]
): Promise<AIWeeklyBrief | null> {
  if (entries.length === 0) return null;

  const formatted = formatEntries(entries.slice(0, 30));

  const result = await ask(
    `Analyze these personal journal entries from the past 7 days. Categories: spore=thought, root=reflection, signal=reminder, decompose=letting go, fruit=action.

${formatted}

Return JSON with these keys:
- "patterns": array of 2-4 pattern strings
- "ripeDecisions": array of 1-3 decisions ready to be made
- "conversationsToHave": array of 1-3 conversations needed
- "thingsToLetGo": array of 1-3 things to release
- "prioritizedActions": array of exactly 3 concrete actions for the week

Each string 1-2 sentences max. Be concise and insightful.`
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
  const trimmed = transcript.slice(0, 8000);

  const result = await ask(
    `Analyze this video transcript. Extract what's useful and actionable.${userNote ? ` User's intent: "${userNote}"` : ""}

Title: ${videoTitle}
Transcript: ${trimmed}

Return JSON:
{"summary": "2-3 sentences", "keyTakeaways": ["3-5 insights"], "actionItems": ["1-3 actions"], "relevantTopics": ["from: health,money,retirement,housing,family,career,relationships,growth,creativity,travel"]}`
  );

  if (!result) return null;
  try {
    return { title: videoTitle, ...JSON.parse(extractJSON(result)) } as VideoAnalysis;
  } catch {
    return null;
  }
}

// ── Web Analysis ─────────────────────────────────────────────

export async function analyzeWebContent(
  text: string,
  title: string,
  siteName: string,
  userNote?: string
): Promise<WebAnalysis | null> {
  const trimmed = text.slice(0, 8000);

  const result = await ask(
    `Analyze this web page. Extract what's useful and actionable.${userNote ? ` User's intent: "${userNote}"` : ""}

Title: ${title} (${siteName})
Content: ${trimmed}

Return JSON:
{"summary": "2-3 sentences", "keyTakeaways": ["3-5 insights"], "actionItems": ["1-3 actions"], "relevantTopics": ["from: health,money,retirement,housing,family,career,relationships,growth,creativity,travel"]}`
  );

  if (!result) return null;
  try {
    return { title, ...JSON.parse(extractJSON(result)) } as WebAnalysis;
  } catch {
    return null;
  }
}

// ── Monthly Review ───────────────────────────────────────────

export async function generateMonthlyReview(
  entries: Entry[]
): Promise<AIMonthlyReview | null> {
  if (entries.length === 0) return null;

  const formatted = formatEntries(entries.slice(0, 40));

  const result = await ask(
    `Analyze these journal entries from the past 30 days.

${formatted}

Return JSON:
{"topFocusAreas": [{"topic":"string","count":0}], "keyDecisions": ["strings"], "circlingThemes": ["unresolved themes"], "shiftedTopics": ["topics that stopped"], "reflection": "one paragraph reflection"}`
  );

  if (!result) return null;
  try {
    return JSON.parse(extractJSON(result)) as AIMonthlyReview;
  } catch {
    return null;
  }
}
