export const CATEGORIES = {
  spore: { label: "Spore", color: "spore", description: "Quick thought / idea" },
  root: { label: "Root", color: "root", description: "Deeper reflection" },
  signal: { label: "Signal", color: "signal", description: "Reminder to self" },
  decompose: { label: "Decompose", color: "decompose", description: "Something to let go" },
  fruit: { label: "Fruit", color: "fruit", description: "Action taken / decision" },
} as const;

export type Category = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
