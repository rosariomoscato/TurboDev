// ---------------------------------------------------------------------------
// Economy Module — Types
// ---------------------------------------------------------------------------
// Self-contained: no imports from other modules.
// ---------------------------------------------------------------------------

/**
 * Economy mode intensity levels.
 *
 * - `'off'` — normal behaviour (default)
 * - `'eco'` — direct and concise, no filler, code stays exact
 * - `'ultra'` — telegraphic fragments, minimal prose, code stays exact
 *
 * The level is persisted in `~/.turbodevrc` as `{ economy: { level: 'eco' } }`.
 */
export const ECONOMY_LEVELS = ['off', 'eco', 'ultra'] as const;

export type EconomyLevel = (typeof ECONOMY_LEVELS)[number];
