import { YoutubeTranscript } from "youtube-transcript";

const YT_URL_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractVideoId(text: string): string | null {
  const match = text.match(YT_URL_REGEX);
  return match ? match[1] : null;
}

export function isYouTubeUrl(text: string): boolean {
  return YT_URL_REGEX.test(text.trim());
}

export async function getTranscript(videoId: string): Promise<string> {
  const segments = await YoutubeTranscript.fetchTranscript(videoId);
  return segments.map((s) => s.text).join(" ");
}

export async function getVideoTitle(videoId: string): Promise<string> {
  try {
    // Use oEmbed API (no key needed)
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) return "Untitled Video";
    const data = await res.json();
    return data.title || "Untitled Video";
  } catch {
    return "Untitled Video";
  }
}
