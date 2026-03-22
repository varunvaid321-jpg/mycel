// Health Monitor — LLM Provider Abstraction
// Easy to swap between Groq, Cloudflare, OpenAI, etc.

export interface LLMProvider {
  name: string;
  ask(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string | null>;
}

// ── Groq Provider (default — 14,400 req/day free) ──

export function createGroqProvider(): LLMProvider | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return {
    name: "groq",
    async ask(systemPrompt, userPrompt, maxTokens) {
      try {
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
        });

        if (res.status === 429) {
          console.warn("[health:groq] RATE LIMITED");
          return null;
        }
        if (!res.ok) {
          console.error(`[health:groq] FAIL ${res.status}`);
          return null;
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() || null;
      } catch (err) {
        console.error("[health:groq] ERROR:", err instanceof Error ? err.message : err);
        return null;
      }
    },
  };
}

// ── Cloudflare Provider (fallback — shares 10k neurons/day) ──

export function createCloudflareProvider(): LLMProvider | null {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiKey = process.env.CF_AI_API_KEY;
  if (!accountId || !apiKey) return null;

  return {
    name: "cloudflare",
    async ask(systemPrompt, userPrompt, maxTokens) {
      try {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              max_tokens: maxTokens,
            }),
          }
        );

        if (res.status === 429) {
          console.warn("[health:cf] RATE LIMITED");
          return null;
        }
        if (!res.ok) return null;

        const data = await res.json();
        return data?.result?.response || null;
      } catch {
        return null;
      }
    },
  };
}

// Get the best available provider (Groq first, then Cloudflare)
export function getProvider(): LLMProvider | null {
  return createGroqProvider() || createCloudflareProvider();
}
