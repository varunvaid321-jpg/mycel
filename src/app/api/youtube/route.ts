import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractVideoId, getTranscript, getVideoTitle } from "@/lib/youtube";
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

  // Fetch transcript and title in parallel
  let transcript: string;
  let title: string;
  try {
    [transcript, title] = await Promise.all([
      getTranscript(videoId),
      getVideoTitle(videoId),
    ]);
  } catch {
    return NextResponse.json(
      { error: "Could not fetch video transcript. The video may not have captions." },
      { status: 422 }
    );
  }

  if (!transcript || transcript.length < 50) {
    return NextResponse.json(
      { error: "Video transcript too short or unavailable." },
      { status: 422 }
    );
  }

  // AI analysis — pass user's note for context (e.g. "use this for motivation")
  const analysis = await analyzeVideoTranscript(transcript, title, userNote);

  // Build entry content
  let content: string;
  if (analysis) {
    const takeaways = analysis.keyTakeaways
      .map((t, i) => `${i + 1}. ${t}`)
      .join("\n");
    const actions = analysis.actionItems
      .map((a) => `→ ${a}`)
      .join("\n");

    content = `📺 ${title}\nhttps://youtube.com/watch?v=${videoId}${userNote ? `\n\nMy note: ${userNote}` : ""}\n\n${analysis.summary}\n\nKey takeaways:\n${takeaways}\n\nAction items:\n${actions}`;
  } else {
    // Fallback: store basic info with truncated transcript
    content = `📺 ${title}\nhttps://youtube.com/watch?v=${videoId}\n\n${transcript.slice(0, 500)}...`;
  }

  // Classify and save
  const { category, topics: classifiedTopics } = classify(content);
  const allTopics = analysis
    ? [...new Set([...analysis.relevantTopics, ...classifiedTopics])].slice(0, 4)
    : classifiedTopics;

  const entry = await prisma.entry.create({
    data: {
      content,
      category: category === "spore" ? "root" : category, // Videos are always at least root-level
      tags: allTopics.join(","),
      localDate,
      localTime,
    },
  });

  return NextResponse.json({ entry, analysis }, { status: 201 });
}
