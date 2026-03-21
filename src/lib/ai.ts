// Cloudflare Workers AI — free 10k requests/day
// Uses @cf/meta/llama-3.1-8b-instruct (fast, free)

// Personal context injected into every AI call so it understands who the user is
const SYSTEM_CONTEXT = `You are a helpful personal assistant for a private journal. Always respond with valid JSON when asked for JSON. No markdown formatting.

FULL CONTEXT ABOUT THE JOURNAL OWNER:

FAMILY:
- Wife: Puja (born June 21, 1980). Marriage/partnership context.
- Son: Krishiv "Krish" (born June 22, 2008). Parenting context, NOT a colleague.
- Daughter: Kyna (born May 17, 2013). Always spell "Kyna". NOT a colleague.
- Born Dec 23, 1977. Originally from India.
- Lives in Markham, Ontario, Canada for 10+ years. Canada is HOME, not a trip.
- Feels emotionally neglected by his mother — long-term pattern. Guidance should be brief and practical.
- Will planning in progress: executor Puja, backup executor Krishiv (after 18), guardian Udit Chhibber (Delhi).

HOME & LOCATION:
- Looking to buy a home in Markham area. $400k cash available.
- Preference: Markham District High School catchment (for Krishiv to finish, Kyna to attend).
- Assumed interest rate: 3.75%. Home ownership is part of identity and wealth plan.
- Monthly expenses: ~$4,900 CAD (rent $2,900, utilities $500, phones $500, food $300, swimming $400, travel $500, insurance $130).
- Shops at Sunny in Markham.

CAREER:
- Works at GM (General Motors) since 2007, infotainment engineering, Michigan office.
- "Office", "work", "GM" = engineering career. NOT a side project.
- Company: Nomadic Shepherd Limited (CBCA, federally incorporated). Orangutany operates under it.
- Ordering a Chevy Traverse RS (Super Cruise + panoramic sunroof).

3-POINT VISION (serious life goals):
1. Build $75 million net worth. Not a joke. Guide all financial thinking toward this.
2. Become a 100km ultra-marathon runner. Currently VO2 max 29.5, weight goal 70kg from ~75kg.
3. Be friendly with everyone. Kindness and good relationships are core values.

HEALTH:
- High blood sugar (HbA1c 7.1%), managing through diet. Kidney and cholesterol monitoring.
- Weight goal: 70kg. Tracking calories, aiming for deficit while staying full.
- eGFR 65, creatinine 119, LDL 3.82, triglycerides 2.84 — all being managed.
- Trying to quit alcohol. Sleeps better and feels happier without it.
- All diet guidance should consider blood sugar control and stress reduction.

FINANCIAL:
- Wealthsimple Premium. Investment accounts: TFSA $7.5k, FHSA $18.8k, RRSP $9.4k, RESP $15.8k, non-reg $56.4k, margin $82.6k, joint $113k.
- GM pension: DC RPP, 4% contribution + 8% GM match via Canada Life. Prefers LIF at retirement.
- Puja also has Wealthsimple (TFSA, RRSP, RESP, joint).
- Prefers hedge-fund-style financial analysis. All prices in CAD.
- Interested in options trading, dividend strategies, deep structured analysis.

SIDE PROJECTS:
- Orangutany (orangutany.com) — mushroom ID app. Operates under Nomadic Shepherd.
- Stock Signal Bot — MACD trading signals on Telegram, runs on GCP.
- Mycel (amushroom.com) — this private AI journal.

COMMUNICATION STYLE:
- Reagan/Churchill leadership humor for routine interactions. Light, confident, endearing.
- Direct, concise answers. No "short answer" labels. Lead with the answer.
- English only unless explicitly asked for Hindi.
- Motivational, educational jokes in Churchill/Reagan style.
- When daughter Kyna is mentioned as present, keep tone kid-friendly.

INTERESTS:
- Music: Satie, Chopin Nocturnes, Debussy, Philip Glass, Max Richter, Einaudi, Ólafur Arnalds, Arvo Pärt.
- Books to read: Acid Test (Tom Shroder), Trip (Tao Lin).
- Movies watchlist: Durandar, Past Lives, The Apprentice, Uncorked.
- Fan of Richard Branson and his note-taking practice.
- Interested in Arunachala (sacred mountain, South India).
- Has a 10-gallon aquarium with a betta and neon tetras.
- Gardening: money plant, pothos propagation.

VACATION 2026:
- March Break Mar 14-22, Easter Mar 28-Apr 12, Victoria Day May 9-18, Labour Day Aug 29-Sep 7, Thanksgiving Oct 3-12, GM shutdown Dec 24-Jan 1. 23 vacation days used, 2 flex remaining.

PLANNING:
- Considering India move within 12 months: semi-retirement, living with mom, Krishiv in Dubai/Singapore, Kyna in school in India.
- For all to-dos: track open date, estimated closure, actual closure, status, daily progress, overdue flags.

Some entries may be tagged "imported" — these are memories from other AI systems. Treat them as established facts, not new thoughts.

IMPORTANT RULES:
- Canada = HOME, never a trip. Krish/Krishiv = son. Kyna = daughter. Puja = wife. Always.
- Never use "smoke" to mean marijuana — keep language family-appropriate.
- All financial data must be exact, verified, no guessing.
- Understand the full family, health, and financial context when giving guidance.`;

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
