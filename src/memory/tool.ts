// ---------------------------------------------------------------------------
// Memory Module — save_memory Tool
// ---------------------------------------------------------------------------
// Implements the `save_memory` tool that the LLM calls to persist durable
// facts to `.turbodev/memory.md`. Wraps `appendMemory` from the store.
// ---------------------------------------------------------------------------

import { appendMemory } from './store.js';
import type { MemoryCategory, MemoryResult } from './types.js';

/** Arguments for the `save_memory` tool. */
export interface SaveMemoryArgs {
  /** The fact to remember. Should be concise, atomic, and useful in future sessions. */
  content: string;
  /** Optional category. One of: preferences, decisions, architecture, facts. Default: facts. */
  category?: MemoryCategory;
}

/** Result returned to the LLM after a save_memory call. */
export interface SaveMemoryResult extends MemoryResult {
  content: string;
  category: MemoryCategory;
}

/**
 * Execute the save_memory tool.
 *
 * @param args - { content, category? }
 * @param cwd  - Working directory (passed from registerSaveMemoryTool closure).
 * @returns Result with success flag, echoed content/category, and optional error.
 */
export function saveMemoryTool(args: SaveMemoryArgs, cwd: string): SaveMemoryResult {
  const content = typeof args.content === 'string' ? args.content : String(args.content ?? '');
  const category = args.category ?? 'facts';

  const result = appendMemory(cwd, content, category);
  return {
    ...result,
    content,
    category,
  };
}
