import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const fmt = (d: Date) => ({
    localDate: d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    localTime: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  });

  const entries = [
    {
      content: "The best ideas don't come from thinking harder. They come from the gaps between thoughts. Need to protect more empty space in mornings.",
      category: "spore",
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      ...fmt(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
    },
    {
      content: "Remember: the discomfort you feel when delegating is not a sign you should do it yourself. It's the muscle growing.",
      category: "signal",
      createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
      ...fmt(new Date(now.getTime() - 18 * 60 * 60 * 1000)),
    },
    {
      content: "Been thinking about the difference between strategy and anxiety. When I'm planning three moves ahead, sometimes it's genuine strategic thinking — seeing the board clearly. But other times it's just anxiety wearing a productivity mask.\n\nThe tell: strategic thinking leaves me energized. Anxiety-planning leaves me exhausted but with an illusion of progress.",
      category: "root",
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      ...fmt(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    },
    {
      content: "Decision: declining the advisory board seat. Not because it's bad — because it's good enough to be distracting. Protecting the main thing.",
      category: "fruit",
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      ...fmt(new Date(now.getTime() - 48 * 60 * 60 * 1000)),
    },
    {
      content: "Letting go of the idea that I need to have a \"personal brand.\" The most interesting people I know are impossible to summarize in a bio. That's the point.",
      category: "decompose",
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      ...fmt(new Date(now.getTime() - 72 * 60 * 60 * 1000)),
    },
    {
      content: "Stop reading about productivity systems. You already know what works. The resistance isn't about the system — it's about the work itself. Face the work.",
      category: "signal",
      createdAt: new Date(now.getTime() - 96 * 60 * 60 * 1000),
      ...fmt(new Date(now.getTime() - 96 * 60 * 60 * 1000)),
    },
  ];

  for (const entry of entries) {
    await prisma.entry.create({ data: entry });
  }

  console.log(`Seeded ${entries.length} entries`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
