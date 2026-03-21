// Real-time emotional state detection + instant guidance
// No API call — pattern matching for immediate response

interface EmotionalState {
  detected: boolean;
  type: "anger" | "anxiety" | "stress" | "sadness" | "frustration" | null;
  guidance: string;
}

const PATTERNS: {
  type: EmotionalState["type"];
  words: RegExp[];
  guidances: string[];
}[] = [
  {
    type: "anger",
    words: [
      /\b(angry|furious|pissed|rage|raging|livid|fuming|infuriated)\b/i,
      /\b(hate|hating|loathe|despise)\b/i,
      /\b(riles?\s+me|drives?\s+me\s+crazy|makes?\s+me\s+mad)\b/i,
      /\b(aggressive|aggression|want\s+to\s+punch|want\s+to\s+scream)\b/i,
      /\b(blast|explode|snap|snapped|blew\s+up|blow\s+up)\b/i,
      /\b(f+u+c+k|shit|damn\s+it|wtf)\b/i,
    ],
    guidances: [
      "Pause. Breathe 4 counts in, 7 out. Nothing sent in anger lands well.",
      "Step away for 5 minutes before responding. The situation will still be there.",
      "Name the feeling, don't act on it. What's actually underneath the anger?",
      "Your future self will thank you for waiting. Write it here, not to them.",
      "Anger is information, not instruction. What boundary is being crossed?",
    ],
  },
  {
    type: "anxiety",
    words: [
      /\b(nervous|anxious|anxiety|panicking|panic|scared|terrified)\b/i,
      /\b(worried|worrying|dread|dreading)\b/i,
      /\b(nervous\s+about|scared\s+of|afraid\s+of|freaking\s+out)\b/i,
      /\b(can't\s+breathe|heart\s+racing|shaking|trembling)\b/i,
      /\b(meeting|presentation|interview|confrontation)\b/i,
    ],
    guidances: [
      "Ground yourself: 5 things you see, 4 you hear, 3 you touch. You're safe right now.",
      "The worst-case scenario you're imagining almost never happens. What's the most likely outcome?",
      "You've handled hard things before. This one is no different.",
      "Preparation beats worry. What's one thing you can do right now to feel readier?",
      "Breathe. You belong in the room. Your perspective matters.",
    ],
  },
  {
    type: "stress",
    words: [
      /\b(overwhelm|overwhelmed|drowning|suffocating|too\s+much)\b/i,
      /\b(burned?\s+out|burnout|exhausted|depleted|can't\s+cope)\b/i,
      /\b(breaking\s+point|falling\s+apart|losing\s+it)\b/i,
      /\b(no\s+time|running\s+out|deadline|pressure)\b/i,
    ],
    guidances: [
      "One thing at a time. What's the single most important thing right now?",
      "You can't pour from an empty cup. Rest is not laziness, it's maintenance.",
      "Drop one thing from today. Give yourself permission. The world won't end.",
      "This pressure is temporary. Write down the three things that actually matter today.",
    ],
  },
  {
    type: "frustration",
    words: [
      /\b(frustrated|frustrating|stuck|blocked|pointless|useless)\b/i,
      /\b(nothing\s+works|giving\s+up|quit|done\s+with|fed\s+up)\b/i,
      /\b(impossible|hopeless|waste\s+of\s+time)\b/i,
      /\b(annoyed|annoying|irritated|irritating)\b/i,
    ],
    guidances: [
      "Frustration means you care. What would 10% progress look like?",
      "Step back and look at it fresh. Sometimes the obstacle is the path.",
      "What would you tell a friend in this exact situation?",
      "Write down what's not working. Seeing it clearly is the first step to changing it.",
    ],
  },
  {
    type: "sadness",
    words: [
      /\b(sad|depressed|crying|lonely|alone|empty|numb)\b/i,
      /\b(miss|missing|lost|grief|grieving|heartbroken)\b/i,
      /\b(don't\s+care|doesn't\s+matter|what's\s+the\s+point)\b/i,
      /\b(failed|failure|worthless|not\s+good\s+enough)\b/i,
    ],
    guidances: [
      "It's okay to feel this. You don't have to fix it right now.",
      "This feeling is real, and it will pass. Be gentle with yourself today.",
      "You're not broken. Hard moments are part of being human.",
      "Reach out to one person today. Connection heals more than solitude.",
    ],
  },
];

export function detectEmotion(text: string): EmotionalState {
  if (!text || text.length < 10) {
    return { detected: false, type: null, guidance: "" };
  }

  for (const pattern of PATTERNS) {
    const matchCount = pattern.words.filter((w) => w.test(text)).length;
    if (matchCount >= 1) {
      // Pick a random guidance
      const guidance =
        pattern.guidances[Math.floor(Math.random() * pattern.guidances.length)];
      return {
        detected: true,
        type: pattern.type,
        guidance,
      };
    }
  }

  return { detected: false, type: null, guidance: "" };
}
