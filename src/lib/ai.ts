// Cloudflare Workers AI — free 10k requests/day
// Uses @cf/meta/llama-3.1-8b-instruct (fast, free)

import { TIMEZONE } from "@/lib/design-tokens";

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
- ALWAYS address the journal owner as "you" — never say "the user", "the journal owner", "they", or "the author". You are speaking directly to them.
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

CRITICAL RULES FOR ANALYSIS:
- ONLY analyze entries the user actually wrote in the journal. The personal context above is BACKGROUND KNOWLEDGE ONLY — use it to understand who they are, but NEVER surface it as a "recurring theme" or "pattern" in weekly/monthly briefs.
- If the user hasn't written about their mother, health, finances, etc. in the journal, do NOT mention those topics in analysis. Only reflect what they actually posted.
- Imported entries (tagged "imported") are reference data for context, NOT journal thoughts. Never include them in theme analysis or weekly patterns.
- Canada = HOME, never a trip. Krish/Krishiv = son. Kyna = daughter. Puja = wife. Always.
- Keep language family-appropriate.
- All financial data must be exact, verified, no guessing.`;

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

export interface HealthDayLog {
  date: string;
  summary: string;
}

export interface AIHealthLog {
  days: HealthDayLog[];
  summary: string;
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

const MAX_RETRIES = 3;

async function askOnce(prompt: string, caller: string): Promise<string | null> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiKey = process.env.CF_AI_API_KEY;
  if (!accountId || !apiKey) {
    console.warn(`[AI:${caller}] SKIP — missing CF_ACCOUNT_ID or CF_AI_API_KEY`);
    return null;
  }

  const start = Date.now();
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

  const elapsed = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[AI:${caller}] FAIL ${res.status} (${elapsed}ms) — ${errText.slice(0, 200)}`);
    // 429 = rate limited (daily quota exhausted) — don't retry, it won't help
    if (res.status === 429) throw new Error("RATE_LIMITED");
    return null;
  }

  const data = await res.json();
  const response = data?.result?.response || null;

  if (!response) {
    console.warn(`[AI:${caller}] EMPTY response (${elapsed}ms) — raw: ${JSON.stringify(data).slice(0, 200)}`);
  } else {
    console.log(`[AI:${caller}] OK (${elapsed}ms) — ${response.length} chars`);
  }

  return response;
}

async function ask(prompt: string, caller: string): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await askOnce(prompt, caller);
      if (result) return result;
      if (attempt < MAX_RETRIES) {
        console.warn(`[AI:${caller}] retry ${attempt}/${MAX_RETRIES}...`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "RATE_LIMITED") {
        console.warn(`[AI:${caller}] RATE LIMITED — daily quota exhausted, skipping retries`);
        return null;
      }
      console.error(`[AI:${caller}] ERROR attempt ${attempt}/${MAX_RETRIES} —`, msg);
      if (attempt >= MAX_RETRIES) return null;
    }
  }
  console.error(`[AI:${caller}] GAVE UP after ${MAX_RETRIES} attempts`);
  return null;
}

function parseJSON<T>(text: string, caller: string): T | null {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    console.error(`[AI:${caller}] JSON parse failed — raw: ${text.slice(0, 300)}`);
    return null;
  }
}

function dayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: TIMEZONE });
}

function formatEntries(entries: Entry[]): string {
  return entries
    .map((e) => {
      const dow = dayOfWeek(e.localDate);
      return `[${dow ? dow + " " : ""}${e.localDate} ${e.localTime}] (${e.category}) ${e.content}`;
    })
    .join("\n\n");
}

// ── Intelligent Guide ────────────────────────────────────────

export async function generateGuide(
  entries: Entry[]
): Promise<GuideResponse | null> {
  if (entries.length < 2) return null;

  const formatted = formatEntries(entries.slice(0, 20));

  const result = await ask(
    `You are a thoughtful personal guide. You are speaking DIRECTLY to the journal owner — use "you" and "your", never "the user" or "they".

Entries:
${formatted}

Say ONE thing that matters right now. Return JSON:
{"message": "one sentence max 25 words", "type": "insight|action|reflection|silent", "intensity": "gentle|warm|direct"}

Rules: Address them directly as "you". If recurring theme without resolution, name it. If they committed to something, remind warmly. If calm, return type "silent". Never preachy. Reference their specific words.`,
    "guide"
  );

  if (!result) return null;
  return parseJSON<GuideResponse>(result, "guide");
}

// ── Auto-correct ─────────────────────────────────────────────

export async function autoCorrect(rawText: string): Promise<string> {
  // Skip AI for very short text (under 10 chars) — not worth the call
  if (rawText.trim().length < 10) return rawText.trim();

  const result = await ask(
    `Fix spelling, grammar, and typos. Keep original meaning and tone. Return ONLY the corrected text, nothing else.\n\nText: ${rawText}`,
    "autocorrect"
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
    `Analyze ONLY these journal entries from the past 7 days. Categories: spore=thought, root=reflection, signal=reminder, decompose=letting go, fruit=action.

IMPORTANT: Only analyze what was ACTUALLY WRITTEN below. Do not bring up topics from background context unless explicitly mentioned in these entries. Entries tagged "imported" or "chatgpt" are reference data — skip them.

TONE: You are speaking DIRECTLY to the journal owner. Always use "you" and "your" — never say "the user", "the journal owner", "they", or "the author". Write like a trusted friend reflecting back what they see, not a therapist writing clinical notes.

${formatted}

Return JSON with these keys:
- "patterns": array of 2-4 pattern strings — use **bold** on key words
- "ripeDecisions": array of 1-3 decisions ready to be made — use **bold** on key words
- "conversationsToHave": array of 1-3 conversations needed — use **bold** on key words
- "thingsToLetGo": array of 1-3 things to release — use **bold** on key words
- "prioritizedActions": array of exactly 3 concrete actions — use **bold** on key words

Each string 1-2 sentences max. Bold the most important 2-3 words in each string using **word**. Address the person as "you" throughout.`,
    "weekly"
  );

  if (!result) return null;
  return parseJSON<AIWeeklyBrief>(result, "weekly");
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
{"summary": "2-3 sentences", "keyTakeaways": ["3-5 insights"], "actionItems": ["1-3 actions"], "relevantTopics": ["from: health,money,retirement,housing,family,career,relationships,growth,creativity,travel"]}`,
    "video"
  );

  if (!result) return null;
  const parsed = parseJSON<Omit<VideoAnalysis, "title">>(result, "video");
  return parsed ? { title: videoTitle, ...parsed } : null;
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
{"summary": "2-3 sentences", "keyTakeaways": ["3-5 insights"], "actionItems": ["1-3 actions"], "relevantTopics": ["from: health,money,retirement,housing,family,career,relationships,growth,creativity,travel"]}`,
    "web"
  );

  if (!result) return null;
  const parsed = parseJSON<Omit<WebAnalysis, "title">>(result, "web");
  return parsed ? { title, ...parsed } : null;
}

// ── Monthly Review ───────────────────────────────────────────

export async function generateMonthlyReview(
  entries: Entry[]
): Promise<AIMonthlyReview | null> {
  if (entries.length === 0) return null;

  const formatted = formatEntries(entries.slice(0, 40));

  const result = await ask(
    `Analyze these journal entries from the past 30 days. You are speaking DIRECTLY to the journal owner — always use "you" and "your", never "the user" or "they". Write like a trusted friend, not a therapist.

${formatted}

Return JSON:
{"topFocusAreas": [{"topic":"string","count":0}], "keyDecisions": ["strings"], "circlingThemes": ["unresolved themes"], "shiftedTopics": ["topics that stopped"], "reflection": "one paragraph reflection addressed directly to you"}`,
    "monthly"
  );

  if (!result) return null;
  return parseJSON<AIMonthlyReview>(result, "monthly");
}

// ── Health Log ──────────────────────────────────────────────

// ── Workout Log (100% code — no AI, no hallucination) ────────

const EXERCISE_KEYWORDS = {
  cardio: [/\bwalk(ed|ing|s)?\b/i, /\brun(ning|s|n)?\b/i, /\bjog(ging|ged)?\b/i, /\bcycl(e|ing|ed)\b/i, /\bswi(m|mming|am)\b/i, /\bcardio\b/i, /\bsteps\b/i, /\bhik(e|ing|ed)\b/i, /\bskipping\s+rope\b/i, /\bjump(ed|ing)?\s+rope\b/i, /\bsprints?\b/i, /\bstair(s|case)?\b/i],
  weights: [/\bgym\b/i, /\bweights?\b/i, /\bpush[-\s]?ups?\b/i, /\bsquats?\b/i, /\bdeadlift/i, /\bbench\s*(press)?\b/i, /\blift(ing|ed)?\b/i, /\bdumbbell/i, /\bexercis(e|ed|ing)\b/i, /\bworkout\b/i, /\bwork(ed|ing)?\s+out\b/i, /\bplanks?\b/i, /\bcrunches?\b/i, /\bsit[-\s]?ups?\b/i, /\bburpees?\b/i, /\bkettlebell/i, /\bresistance\b/i, /\breps?\b/i, /\bsets?\s+of\b/i],
  sport: [/\bcricket\b/i, /\bbadminton\b/i, /\btennis\b/i, /\btable\s+tennis\b/i, /\bbasketball\b/i, /\bfootball\b/i, /\bsoccer\b/i, /\bplay(ed|ing)\b/i, /\byoga\b/i, /\bstretch(ing|ed)?\b/i, /\bmeditat(e|ed|ing|ion)\b/i, /\bpranayam\b/i, /\bbreathing\s+exercis/i, /\bpilates\b/i, /\bboxing\b/i, /\bmartial\s+arts?\b/i, /\bvolleyball\b/i, /\bgolf(ed|ing)?\b/i, /\bskat(e|ed|ing)\b/i, /\bdanc(e|ed|ing)\b/i, /\btai\s+chi\b/i, /\bmindfulness\b/i, /\bmental\s+workout\b/i, /\bbrain\s+training\b/i],
};

const NEGATIVE_PATTERNS = [
  /\b(did\s+not|didn'?t|couldn'?t|can'?t|won'?t|not\s+able)\b.*\b(exercise|workout|work\s+out|play|gym|run|walk|swim|motivat)/i,
  /\bskipped?\b.*\b(exercise|workout|work\s+out|gym)/i,
  /\bwanted?\s+to\s+but\b/i,
  /\bno\s+(workout|exercise|gym)\b/i,
  /\brest\s+day\b/i,
  /\bdon'?t\s+feel\s+motivat/i,
  /\bunable\s+to\s+(get|exercise|work|move)/i,
  /\bletharg/i,
  /\bwant\s+to\s+(start|work|exercise|gym)\b.*\bbut\b/i,
  /\b(ensure|make\s+sure|tell|ask|want)\b.*\b(kyna|krish|puja|kids?|daughter|son|wife)\b.*\b(swim|soccer|volleyball|exercise|active|sport)/i,
];

function detectExerciseType(text: string): { cardio: boolean; weights: boolean; sport: boolean } {
  return {
    cardio: EXERCISE_KEYWORDS.cardio.some((r) => r.test(text)),
    weights: EXERCISE_KEYWORDS.weights.some((r) => r.test(text)),
    sport: EXERCISE_KEYWORDS.sport.some((r) => r.test(text)),
  };
}

// Patterns that indicate talking about SOMEONE ELSE's exercise, not yours
const THIRD_PERSON_EXERCISE = [
  /\b(kyna|krish|puja|daughter|son|wife|kids?|she|her|he|his|them|they)\b.{0,30}\b(dance|swim|soccer|volleyball|walk|exercise|sport|active|gym|yoga)/i,
  /\b(ask|told|tell|want|ensure|make\s+sure)\b.{0,30}\b(walk|swim|exercise|sport|active|dance|yoga)/i,
  /\b(select|pick|buy|choose)\b.{0,20}\b(swim|sport|dance|gym)/i,
];

function isExerciseEntry(text: string): boolean {
  // Check negative context first
  if (NEGATIVE_PATTERNS.some((r) => r.test(text))) return false;
  // Check if talking about someone else's exercise
  if (THIRD_PERSON_EXERCISE.some((r) => r.test(text))) return false;
  // Check if any exercise keyword matches
  const types = detectExerciseType(text);
  return types.cardio || types.weights || types.sport;
}

// ── Groq API (free tier — 14,400 req/day, separate from Cloudflare) ──
// Used ONLY for workout log extraction — keeps Cloudflare quota for weekly/monthly/guide

async function askGroq(text: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Extract ONLY the physical activity from this journal entry. Use the person's exact words. Max 15 words. If no exercise happened, return NONE. Never add details not in the text." },
          { role: "user", content: text },
        ],
        max_tokens: 50,
        temperature: 0,
      }),
    });

    if (res.status === 429) {
      console.warn("[groq] RATE LIMITED — skipping");
      return null;
    }
    if (!res.ok) return null;

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply || reply === "NONE" || reply.length < 3) return null;

    // Validate: every significant word in the reply must exist in the source
    const sourceWords = new Set(text.toLowerCase().split(/\s+/));
    const replyWords = reply.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w: string) => w.length > 2);
    const fabricated = replyWords.filter((w: string) => !sourceWords.has(w));
    if (fabricated.length > 2) {
      console.warn(`[groq] REJECTED — fabricated words: ${fabricated.join(", ")}`);
      return null;
    }

    return reply;
  } catch {
    return null;
  }
}

// Fallback: keyword window extraction (no AI)
function extractExerciseWindow(text: string): string {
  const allKeywords = [
    ...EXERCISE_KEYWORDS.cardio,
    ...EXERCISE_KEYWORDS.weights,
    ...EXERCISE_KEYWORDS.sport,
  ];
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const chunk = words.slice(Math.max(0, i - 2), i + 8).join(" ");
    if (allKeywords.some((r) => r.test(chunk))) {
      return chunk.length > 80 ? chunk.slice(0, 77) + "..." : chunk;
    }
  }
  return text.slice(0, 60);
}

// Extract exercise part: try Groq first, fall back to keyword window
async function extractExercisePart(text: string): Promise<string> {
  const groqResult = await askGroq(text);
  if (groqResult) return groqResult;
  return extractExerciseWindow(text);
}

export async function generateHealthLog(
  thisWeekEntries: Entry[],
  lastWeekEntries: Entry[]
): Promise<AIHealthLog | null> {
  // Filter to last 5 days, exclude imported
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const recent = thisWeekEntries.filter(
    (e) => new Date(e.createdAt) >= fiveDaysAgo && !e.tags?.includes("imported")
  );

  // Find exercise entries and group by day
  const dayGroups: Record<string, string[]> = {};
  const dayOrder: string[] = [];
  const allTypes = { cardio: false, weights: false, sport: false };

  for (const e of recent) {
    if (!isExerciseEntry(e.content)) continue;
    const types = detectExerciseType(e.content);
    if (types.cardio) allTypes.cardio = true;
    if (types.weights) allTypes.weights = true;
    if (types.sport) allTypes.sport = true;

    const dow = dayOfWeek(e.localDate);
    const dateKey = `${dow ? dow + " " : ""}${e.localDate}`.trim();
    if (!dayGroups[dateKey]) {
      dayGroups[dateKey] = [];
      dayOrder.push(dateKey);
    }
    // Extract only the exercise-relevant part, not the full journal entry
    const text = await extractExercisePart(e.content);
    dayGroups[dateKey].push(text);
  }

  if (dayOrder.length === 0) return null;

  // Build day entries (raw text, combined per day)
  const days: HealthDayLog[] = dayOrder.map((dateKey) => ({
    date: dateKey,
    summary: dayGroups[dateKey].join(". ").replace(/\.\./g, "."),
  }));

  // Count this week vs last week workout days
  const thisWeekDays = dayOrder.length;
  const lastWeekExerciseDays = new Set<string>();
  for (const e of lastWeekEntries) {
    if (!e.tags?.includes("imported") && isExerciseEntry(e.content)) {
      lastWeekExerciseDays.add(e.localDate);
    }
  }
  const lastWeekDays = lastWeekExerciseDays.size;

  // Build summary: count + trend + type nudge
  let trend = "";
  if (lastWeekDays === 0) {
    trend = `${thisWeekDays} workout${thisWeekDays > 1 ? "s" : ""} this week.`;
  } else if (thisWeekDays > lastWeekDays) {
    trend = `${thisWeekDays} workout${thisWeekDays > 1 ? "s" : ""} this week, up from ${lastWeekDays} last week.`;
  } else if (thisWeekDays === lastWeekDays) {
    trend = `${thisWeekDays} workout${thisWeekDays > 1 ? "s" : ""} this week, same as last week.`;
  } else {
    trend = `${thisWeekDays} workout${thisWeekDays > 1 ? "s" : ""} this week, down from ${lastWeekDays} last week.`;
  }

  // Type nudge
  const typeCount = [allTypes.cardio, allTypes.weights, allTypes.sport].filter(Boolean).length;
  let nudge = "";
  if (typeCount === 1) {
    if (allTypes.cardio) nudge = " Try adding weights or a sport next week.";
    else if (allTypes.weights) nudge = " Mix in cardio or a sport next week?";
    else if (allTypes.sport) nudge = " Add some weights or cardio to complement.";
  } else if (typeCount >= 2) {
    nudge = " Good mix — keep it going.";
  }

  return { days, summary: trend + nudge };
}
