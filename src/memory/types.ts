// ---------------------------------------------------------------------------
// Memory Module — Core Types
// ---------------------------------------------------------------------------
// Self-contained: no imports from other modules.
// ---------------------------------------------------------------------------

/**
 * Memory categories. The order here defines the display order in the UI
 * and the section order in the Markdown file. The default category is
 * `'facts'` when none is specified.
 */
export const MEMORY_CATEGORIES = [
  'preferences',
  'decisions',
  'architecture',
  'facts',
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

/**
 * A single memory entry parsed from the Markdown file.
 */
export interface MemoryEntry {
  category: MemoryCategory;
  content: string;
}

/**
 * Result of a write operation (append or clear).
 */
export interface MemoryResult {
  success: boolean;
  error?: string;
}
