// Health Monitor — LLM Provider with timeout

export interface LLMProvider {
  name: string;
  ask(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string | null>;
}

const TIMEOUT_MS = 10_000; // 10 seconds

export function createGroqProvider(): LLMProvider | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return {
    name: "groq",
    async ask(systemPrompt, userPrompt, maxTokens) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const start = Date.now();
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature: 0,
          }),
          signal: controller.signal,
        });
        const elapsed = Date.now() - start;

        if (res.status === 429) {
          console.warn(`[health:groq] RATE LIMITED (${elapsed}ms)`);
          return null;
        }
        if (!res.ok) {
          console.error(`[health:groq] FAIL ${res.status} (${elapsed}ms)`);
          return null;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        console.log(`[health:groq] OK (${elapsed}ms)`);
        return typeof content === "string" ? content.trim() : null;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.error("[health:groq] TIMEOUT after 10s");
        } else {
          console.error("[health:groq] ERROR:", err instanceof Error ? err.message : err);
        }
        return null;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

// Groq only for health — Cloudflare 8B too weak for structured extraction
export function getProvider(): LLMProvider | null {
  return createGroqProvider();
}
