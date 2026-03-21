import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractVideoId, getTranscript, getVideoMeta } from "@/lib/youtube";
import { analyzeVideoTranscript, analyzeWebContent } from "@/lib/ai";
import { extractWebContent } from "@/lib/web-extract";
import { classify } from "@/lib/classifier";

export const dynamic = "force-dynamic";

function findUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

export async function POST(request: Request) {
  const { content, userNote, localDate, localTime } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const url = findUrl(content.trim());
  if (!url) {
    return NextResponse.json({ error: "No URL found" }, { status: 400 });
  }

  // Detect URL type
  const videoId = extractVideoId(url);
  const isYouTube = !!videoId;

  let entryContent: string;
  let analysis: { title?: string; summary: string; keyTakeaways: string[]; actionItems: string[]; relevantTopics: string[] } | null = null;

  if (isYouTube && videoId) {
    // YouTube flow
    const [meta, transcript] = await Promise.all([
      getVideoMeta(videoId),
      getTranscript(videoId),
    ]);

    const hasTranscript = transcript && transcript.length >= 50;

    if (hasTranscript) {
      analysis = await analyzeVideoTranscript(transcript, meta.title, userNote);
    }

    if (analysis) {
      const takeaways = analysis.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join("\n");
      const actions = analysis.actionItems.map((a) => `→ ${a}`).join("\n");
      entryContent = `📺 ${meta.title}${meta.author ? ` — ${meta.author}` : ""}\n${url}${userNote ? `\n\nMy note: ${userNote}` : ""}\n\n${analysis.summary}\n\nKey takeaways:\n${takeaways}\n\nAction items:\n${actions}`;
    } else {
      entryContent = `📺 ${meta.title}${meta.author ? ` — ${meta.author}` : ""}\n${url}${userNote ? `\n\nMy note: ${userNote}` : "\n\nSaved — no transcript available for deep analysis."}`;
    }
  } else {
    // Web page flow
    try {
      const { title, text, siteName } = await extractWebContent(url);

      if (text.length >= 100) {
        analysis = await analyzeWebContent(text, title, siteName, userNote);
      }

      if (analysis) {
        const takeaways = analysis.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join("\n");
        const actions = analysis.actionItems.map((a) => `→ ${a}`).join("\n");
        entryContent = `🔗 ${analysis.title}\n${url}${userNote ? `\n\nMy note: ${userNote}` : ""}\n\n${analysis.summary}\n\nKey takeaways:\n${takeaways}\n\nAction items:\n${actions}`;
      } else {
        entryContent = `🔗 ${title}\n${url}${userNote ? `\n\nMy note: ${userNote}` : ""}${text ? `\n\n${text.slice(0, 300)}...` : ""}`;
      }
    } catch {
      // Can't fetch the page — still save as bookmark
      entryContent = `🔗 ${url}${userNote ? `\n\nMy note: ${userNote}` : "\n\nSaved — could not fetch page content."}`;
    }
  }

  // Classify and save
  const { category, topics: classifiedTopics } = classify(entryContent);
  const allTopics =
    analysis?.relevantTopics
      ? [...new Set([...analysis.relevantTopics, ...classifiedTopics])].slice(0, 4)
      : classifiedTopics;

  const entry = await prisma.entry.create({
    data: {
      content: entryContent,
      category: category === "spore" ? "root" : category,
      tags: allTopics.join(","),
      localDate,
      localTime,
    },
  });

  return NextResponse.json({ entry, analysis }, { status: 201 });
}
