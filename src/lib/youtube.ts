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

export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    if (!segments || segments.length === 0) return null;
    return segments.map((s) => s.text).join(" ");
  } catch {
    return null;
  }
}

interface VideoMeta {
  title: string;
  author: string;
}

export async function getVideoMeta(videoId: string): Promise<VideoMeta> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) return { title: "Untitled Video", author: "" };
    const data = await res.json();
    return {
      title: data.title || "Untitled Video",
      author: data.author_name || "",
    };
  } catch {
    return { title: "Untitled Video", author: "" };
  }
}
