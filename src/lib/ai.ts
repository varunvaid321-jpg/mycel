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
