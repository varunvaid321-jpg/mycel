import * as cheerio from "cheerio";

export async function extractWebContent(url: string): Promise<{
  title: string;
  text: string;
  siteName: string;
}> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, aside, iframe, noscript, svg").remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $(".sidebar, .menu, .nav, .footer, .header, .ad, .advertisement, .cookie").remove();

  // Get title
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled";

  // Get site name
  const siteName =
    $('meta[property="og:site_name"]').attr("content") ||
    new URL(url).hostname.replace("www.", "");

  // Get main content - try article first, then main, then body
  let text = "";
  const selectors = ["article", "main", '[role="main"]', ".post-content", ".article-body", ".entry-content", "body"];

  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 200) break;
    }
  }

  // Truncate to ~15k chars for AI processing
  text = text.slice(0, 15000);

  return { title, text, siteName };
}
