// Golden Dataset — 25 entries reflecting real journal style
// Each entry has expected health extraction result

export interface GoldenEntry {
  id: string;
  content: string;
  shouldInclude: boolean;
  expectedPhrase?: string;
  expectedType?: string;
  excludeReason?: string;
}

export const GOLDEN_DATASET: GoldenEntry[] = [
  // ── Should INCLUDE ──
  {
    id: "g1",
    content: "I completed 10 push-ups at 10 am.",
    shouldInclude: true,
    expectedPhrase: "completed 10 push-ups",
    expectedType: "strength",
  },
  {
    id: "g2",
    content: "We played table tennis Krish and me and loved it!",
    shouldInclude: true,
    expectedPhrase: "played table tennis",
    expectedType: "sport",
  },
  {
    id: "g3",
    content: "Good gym day",
    shouldInclude: true,
    expectedPhrase: "good gym day",
    expectedType: "unknown",
  },
  {
    id: "g4",
    content: "I did some weights and also an hour of walking, which led to a total of 5km covered today.",
    shouldInclude: true,
    expectedPhrase: "did some weights",
    expectedType: "strength",
  },
  {
    id: "g5",
    content: "As I was walking back home from the gym, some of the anger and frustration that I have with Krish is also getting directed at me.",
    shouldInclude: true,
    expectedPhrase: "walking back home from the gym",
    expectedType: "walking",
  },
  {
    id: "g6",
    content: "Day one of exercise successfully completed.",
    shouldInclude: true,
    expectedPhrase: "exercise successfully completed",
    expectedType: "unknown",
  },
  {
    id: "g7",
    content: "gym done!",
    shouldInclude: true,
    expectedPhrase: "gym done",
    expectedType: "unknown",
  },
  {
    id: "g8",
    content: "I'm at the gym and happy to work out. Good training, Puja and Kyna are off to select their swim dresses.",
    shouldInclude: true,
    expectedPhrase: "at the gym",
    expectedType: "unknown",
  },
  {
    id: "g9",
    content: "walked 5km after dinner with Puja",
    shouldInclude: true,
    expectedPhrase: "walked 5km after dinner",
    expectedType: "walking",
  },
  {
    id: "g10",
    content: "Did 30 minutes of yoga this morning, feeling great.",
    shouldInclude: true,
    expectedPhrase: "30 minutes of yoga",
    expectedType: "mobility",
  },

  // ── Should EXCLUDE ──
  {
    id: "g11",
    content: "Need to do a few pushups and get started for the day.",
    shouldInclude: false,
    excludeReason: "intention_only",
  },
  {
    id: "g12",
    content: "I don't feel motivated to exercise, walk, or do anything else useful.",
    shouldInclude: false,
    excludeReason: "intention_only",
  },
  {
    id: "g13",
    content: "i want to work out and i want to start today, but somehow i am very lethargic.",
    shouldInclude: false,
    excludeReason: "intention_only",
  },
  {
    id: "g14",
    content: "Kyna at dance.",
    shouldInclude: false,
    excludeReason: "third_person_only",
  },
  {
    id: "g15",
    content: "I asked Puja to ensure Kyna is very active physically, swimming, soccer, or volleyball.",
    shouldInclude: false,
    excludeReason: "third_person_only",
  },
  {
    id: "g16",
    content: "I asked her to take the kids for a walk regularly, and she starts yelling.",
    shouldInclude: false,
    excludeReason: "third_person_only",
  },
  {
    id: "g17",
    content: "learn scuba diving this summer",
    shouldInclude: false,
    excludeReason: "intention_only",
  },
  {
    id: "g18",
    content: "should go to the gym tomorrow",
    shouldInclude: false,
    excludeReason: "intention_only",
  },
  {
    id: "g19",
    content: "Puja and me and Krish ate at the lunch table - Navratri festival rajma chawal paratha and Karela.",
    shouldInclude: false,
    excludeReason: "no_health_signal",
  },
  {
    id: "g20",
    content: "It's 3 AM, and I'm still not asleep, but my family seems to be getting back to normal.",
    shouldInclude: false,
    excludeReason: "no_health_signal",
  },
  {
    id: "g21",
    content: "okay so this thought is about growing a plant this summer",
    shouldInclude: false,
    excludeReason: "no_health_signal",
  },
  {
    id: "g22",
    content: "Puja and Kyna are off to select their swim dresses",
    shouldInclude: false,
    excludeReason: "third_person_only",
  },
  {
    id: "g23",
    content: "planning to try a new workout routine next week",
    shouldInclude: false,
    excludeReason: "intention_only",
  },
  {
    id: "g24",
    content: "It's 12:30 and I'm still lying on the same bed, half asleep and unable to get up.",
    shouldInclude: false,
    excludeReason: "no_health_signal",
  },
  {
    id: "g25",
    content: "I want to start hitting the gym every day, no matter what. be a positive person.",
    shouldInclude: false,
    excludeReason: "intention_only",
  },
];
