import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractVideoId, getTranscript, getVideoMeta } from "@/lib/youtube";
import { analyzeVideoTranscript } from "@/lib/ai";
import { classify } from "@/lib/classifier";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { url, userNote, localDate, localTime } = await request.json();

  if (!url?.trim()) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const videoId = extractVideoId(url.trim());
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  // Fetch metadata and transcript in parallel
  const [meta, transcript] = await Promise.all([
    getVideoMeta(videoId),
    getTranscript(videoId),
  ]);

  const hasTranscript = transcript && transcript.length >= 50;
  let content: string;
  let analysis = null;

  if (hasTranscript) {
    // Full AI analysis with transcript
    analysis = await analyzeVideoTranscript(transcript, meta.title, userNote);

    if (analysis) {
      const takeaways = analysis.keyTakeaways
        .map((t, i) => `${i + 1}. ${t}`)
        .join("\n");
      const actions = analysis.actionItems
        .map((a) => `→ ${a}`)
        .join("\n");

      content = `📺 ${meta.title}${meta.author ? ` — ${meta.author}` : ""}\nhttps://youtube.com/watch?v=${videoId}${userNote ? `\n\nMy note: ${userNote}` : ""}\n\n${analysis.summary}\n\nKey takeaways:\n${takeaways}\n\nAction items:\n${actions}`;
    } else {
      content = `📺 ${meta.title}${meta.author ? ` — ${meta.author}` : ""}\nhttps://youtube.com/watch?v=${videoId}${userNote ? `\n\nMy note: ${userNote}` : ""}\n\n${transcript.slice(0, 500)}...`;
    }
  } else {
    // No transcript — save as a bookmark with user's note
    content = `📺 ${meta.title}${meta.author ? ` — ${meta.author}` : ""}\nhttps://youtube.com/watch?v=${videoId}${userNote ? `\n\nMy note: ${userNote}` : "\n\nSaved for later — no transcript available for analysis."}`;
  }

  // Classify and save
  const { category, topics: classifiedTopics } = classify(content);
  const allTopics =
    analysis && analysis.relevantTopics
      ? [...new Set([...analysis.relevantTopics, ...classifiedTopics])].slice(0, 4)
      : classifiedTopics;

  const entry = await prisma.entry.create({
    data: {
      content,
      category: category === "spore" ? "root" : category,
      tags: allTopics.join(","),
      localDate,
      localTime,
    },
  });

  return NextResponse.json(
    { entry, analysis, hasTranscript },
    { status: 201 }
  );
}
