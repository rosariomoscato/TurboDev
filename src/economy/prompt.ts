// ---------------------------------------------------------------------------
// Economy Module — Conciseness Prompts
// ---------------------------------------------------------------------------
// Returns the system-prompt instruction string for each economy level.
// When level is 'off', returns null (no section injected).
// ---------------------------------------------------------------------------

import type { EconomyLevel } from './types.js';

/**
 * The eco-level prompt: direct and concise but still professional.
 * Drops filler and pleasantries; keeps code/paths/commands exact.
 */
const ECO_PROMPT = `## Economy Mode (ACTIVE — eco)

You are in economy mode. Follow these rules:
- Be direct and concise. Drop filler words and pleasantries.
- Do not repeat the user's question or explain what you're about to do.
- Do not say "let me...", "I'll now...", "sure!", or similar.
- Keep code, commands, file paths, and error messages EXACT.
- Same language as the user.`;

/**
 * The ultra-level prompt: telegraphic, minimal prose.
 * Sentence fragments only; no explanations unless explicitly asked.
 */
const ULTRA_PROMPT = `## Economy Mode (ACTIVE — ultra)

You are in ultra economy mode. Be extremely concise:
- Use sentence fragments. No full sentences unless absolutely necessary.
- No explanations unless explicitly asked.
- No transitions, no pleasantries, no "let me..." or "I'll...".
- Code, commands, paths, errors: exact and nothing else.
- Same language as the user.`;

/**
 * Get the economy-mode system-prompt section for the given level.
 *
 * Returns `null` when level is `'off'` (no section injected, zero token cost).
 * Returns the prompt string for `'eco'` and `'ultra'`.
 */
export function getEconomyPrompt(level: EconomyLevel): string | null {
  switch (level) {
    case 'eco':
      return ECO_PROMPT;
    case 'ultra':
      return ULTRA_PROMPT;
    default:
      return null;
  }
}
