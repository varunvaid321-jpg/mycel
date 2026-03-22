# Health Monitor

Extracts physical activity from free-form journal entries and produces a structured weekly health report.

## Data Flow

```
Journal entries (30 days)
  → extract.ts: LLM extracts structured health signals per entry
  → validate.ts: Ground-truth check (reject fabricated words)
  → aggregate.ts: Group validated signals by day, deduplicate
  → summarize.ts: LLM generates week summary from validated data only
  → HealthMonitorOutput (structured JSON for UI)
```

## Provider Abstraction

`provider.ts` defines an `LLMProvider` interface. Currently supports:
- **Groq** (default) — 14,400 req/day free, llama-3.3-70b
- **Cloudflare Workers AI** (fallback) — 10k neurons/day free, llama-3.1-8b

To add a new provider: implement `LLMProvider.ask()` and add to `getProvider()`.

## Validation Rules

Every extracted activity label is checked against the source entry text:
1. Split label into words (>2 chars)
2. Each word must exist in the source entry
3. If >30% of words are fabricated → signal discarded
4. Low confidence signals → discarded
5. Excluded signals (intention, third-person) → discarded

## Failure Behavior

| Failure | Behavior |
|---------|----------|
| No LLM provider (missing keys) | Returns null → section hidden |
| LLM rate limited (429) | Returns null → section hidden |
| LLM returns invalid JSON | Signals empty → section hidden |
| Validation rejects all signals | No active days → section hidden |
| Partial failure (some entries fail) | Shows only validated entries |

**Never shows garbage fallback.** If quality can't be guaranteed, the section is hidden.

## Gold-Standard Examples

| Entry | Result |
|-------|--------|
| "I completed 10 push-ups at 10 am" | ✓ strength, "completed 10 push-ups" |
| "Need to do a few pushups" | ✗ excluded (intention_only) |
| "Good gym day" | ✓ unknown type, "good gym day" |
| "We played table tennis Krish and me" | ✓ sport, "played table tennis" |
| "Kyna at dance" | ✗ excluded (third_person_only) |
| "I asked her to take the kids for a walk" | ✗ excluded (third_person_only) |
| "I did some weights and an hour of walking" | ✓ two signals: strength + walking |
