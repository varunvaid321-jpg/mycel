import type { Category } from "./categories";

// ── Life topics ──────────────────────────────────────────────
export const TOPICS = {
  health: {
    label: "Health",
    keywords: [
      "health", "exercise", "workout", "gym", "sleep", "diet", "weight",
      "mental", "anxiety", "stress", "therapy", "meditation", "yoga",
      "doctor", "sick", "energy", "tired", "exhausted", "burnout",
      "running", "walking", "body", "pain", "habit", "morning routine",
      "caffeine", "alcohol", "wellness", "mindfulness", "breathing",
    ],
  },
  money: {
    label: "Money",
    keywords: [
      "money", "salary", "income", "invest", "investment", "portfolio",
      "stock", "crypto", "savings", "budget", "debt", "loan", "mortgage",
      "expense", "spending", "financial", "bank", "credit", "pay",
      "raise", "bonus", "revenue", "profit", "tax", "wealth", "net worth",
      "compound", "dividend", "401k", "rrsp", "tfsa",
    ],
  },
  retirement: {
    label: "Retirement",
    keywords: [
      "retire", "retirement", "pension", "401k", "rrsp", "tfsa",
      "nest egg", "fire", "financial independence", "passive income",
      "long term", "old age", "later years", "freedom number",
    ],
  },
  housing: {
    label: "Housing",
    keywords: [
      "house", "home", "apartment", "condo", "rent", "mortgage",
      "property", "real estate", "move", "moving", "renovate",
      "renovation", "neighborhood", "landlord", "lease", "buy a place",
      "downpayment", "down payment",
    ],
  },
  family: {
    label: "Family",
    keywords: [
      "family", "parents", "mom", "dad", "mother", "father", "brother",
      "sister", "sibling", "kids", "children", "son", "daughter", "wife",
      "husband", "partner", "spouse", "marriage", "wedding", "baby",
      "grandparent", "uncle", "aunt", "cousin", "in-laws",
    ],
  },
  career: {
    label: "Career",
    keywords: [
      "career", "job", "work", "office", "boss", "manager", "promotion",
      "hire", "hiring", "fired", "quit", "resign", "company", "startup",
      "business", "founder", "cofounder", "co-founder", "team", "meeting",
      "project", "deadline", "client", "customer", "interview", "resume",
      "skill", "leadership", "delegate", "delegating", "corporate",
    ],
  },
  relationships: {
    label: "Relationships",
    keywords: [
      "friend", "friendship", "relationship", "dating", "love",
      "trust", "boundary", "boundaries", "conflict", "argument",
      "communication", "lonely", "loneliness", "social", "connection",
      "people", "toxic", "supportive", "breakup", "forgive",
    ],
  },
  growth: {
    label: "Growth",
    keywords: [
      "learn", "learning", "read", "reading", "book", "course",
      "growth", "improve", "self", "reflect", "reflection", "journal",
      "mindset", "discipline", "focus", "purpose", "meaning", "values",
      "identity", "confidence", "fear", "comfort zone", "challenge",
      "curiosity", "wisdom", "philosophy", "thinking", "ideas",
    ],
  },
  creativity: {
    label: "Creativity",
    keywords: [
      "create", "creative", "writing", "write", "art", "design",
      "build", "music", "paint", "craft", "project", "side project",
      "inspiration", "imagine", "vision", "experiment", "prototype",
      "ship", "launch", "maker", "blog", "content",
    ],
  },
  travel: {
    label: "Travel",
    keywords: [
      "travel", "trip", "vacation", "flight", "airport", "hotel",
      "country", "city", "explore", "adventure", "passport", "abroad",
      "backpack", "road trip", "destination",
    ],
  },
} as const;

export type Topic = keyof typeof TOPICS;

// ── Entry type classifier ────────────────────────────────────

const SIGNAL_PATTERNS = [
  /\bremember\b/i, /\bdon'?t forget\b/i, /\bremind\b/i, /\bnote to self\b/i,
  /\bnever\b/i, /\balways\b/i, /\bmust\b/i, /\bshould\b/i, /\bneed to\b/i,
  /\bwatch out\b/i, /\bkeep in mind\b/i, /\bimportant:/i, /\brule:/i,
  /\bstop\s+\w+ing\b/i, /\bstart\s+\w+ing\b/i,
];

const DECOMPOSE_PATTERNS = [
  /\blet(ting)?\s+(it\s+)?go\b/i, /\brelease\b/i, /\benough\b/i,
  /\bno longer\b/i, /\bmoving on\b/i, /\bover it\b/i, /\bdone with\b/i,
  /\bquit\b/i, /\bsurrender\b/i, /\baccept(ing|ance)?\b/i,
  /\bstop caring\b/i, /\bdoesn'?t matter\b/i, /\blet it be\b/i,
];

const FRUIT_PATTERNS = [
  /\bdecid(ed|ing|sion)\b/i, /\bdone\b/i, /\bcompleted?\b/i,
  /\bchose\b/i, /\bcommit(ted)?\b/i, /\baction(ed)?\b/i,
  /\bfinished\b/i, /\bshipped\b/i, /\blaunched\b/i, /\bsigned\b/i,
  /\bbooked\b/i, /\bscheduled\b/i, /\bcancelled\b/i, /\bdeclining\b/i,
  /\bsaid (yes|no)\b/i, /\bdid it\b/i,
];

function matchCount(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

export function classifyType(content: string): Category {
  const text = content.trim();
  const len = text.length;
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;

  const signalScore = matchCount(text, SIGNAL_PATTERNS);
  const decomposeScore = matchCount(text, DECOMPOSE_PATTERNS);
  const fruitScore = matchCount(text, FRUIT_PATTERNS);

  // Strong pattern matches win
  if (fruitScore >= 2 || (fruitScore >= 1 && len < 200)) return "fruit";
  if (decomposeScore >= 2 || (decomposeScore >= 1 && len < 200)) return "decompose";
  if (signalScore >= 2 || (signalScore >= 1 && len < 150)) return "signal";

  // Long-form = root
  if (len > 300 || paragraphs >= 2) return "root";

  // Default
  return "spore";
}

// ── Topic classifier ─────────────────────────────────────────

export function classifyTopics(content: string): Topic[] {
  const lower = content.toLowerCase();
  const matched: { topic: Topic; score: number }[] = [];

  for (const [key, { keywords }] of Object.entries(TOPICS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > 0) {
      matched.push({ topic: key as Topic, score });
    }
  }

  // Return top 3 topics, sorted by relevance
  return matched
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => m.topic);
}

// ── Combined classifier ──────────────────────────────────────

export function classify(content: string): { category: Category; topics: Topic[] } {
  return {
    category: classifyType(content),
    topics: classifyTopics(content),
  };
}
