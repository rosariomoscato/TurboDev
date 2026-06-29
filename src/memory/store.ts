// ---------------------------------------------------------------------------
// Memory Module — Markdown Store
// ---------------------------------------------------------------------------
// Reads, parses, appends, and clears `.turbodev/memory.md`. The file is plain
// Markdown with a fixed header and one `## <category>` section per category.
// All operations are synchronous (file is small) and never throw — errors
// surface as `{ success: false, error }`.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import type { MemoryCategory, MemoryEntry, MemoryResult } from './types.js';
import { MEMORY_CATEGORIES } from './types.js';

/** Path to the memory file: <cwd>/.turbodev/memory.md */
export function getMemoryPath(cwd: string): string {
  return path.join(cwd, '.turbodev', 'memory.md');
}

/**
 * Load the raw Markdown content of the memory file.
 * Returns '' if the file does not exist (normal — no memory yet).
 * Never throws.
 */
export function loadMemory(cwd: string): string {
  try {
    return fs.readFileSync(getMemoryPath(cwd), 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Parse the memory file into structured entries.
 * Returns [] if the file is missing or unparseable.
 *
 * Each `## <category>` section contributes one entry per `- <content>` bullet.
 * Lines outside any section header are ignored. Unknown category names are
 * silently skipped (tolerant reading).
 */
export function loadMemoryEntries(cwd: string): MemoryEntry[] {
  const raw = loadMemory(cwd);
  if (!raw.trim()) return [];

  const entries: MemoryEntry[] = [];
  let currentCategory: MemoryCategory | null = null;

  for (const line of raw.split('\n')) {
    const sectionMatch = /^## (\w+)/.exec(line);
    if (sectionMatch) {
      const cat = sectionMatch[1];
      currentCategory = MEMORY_CATEGORIES.includes(cat as MemoryCategory)
        ? (cat as MemoryCategory)
        : null;
      continue;
    }
    const bulletMatch = /^- (.+)$/.exec(line.trim());
    if (bulletMatch && currentCategory) {
      entries.push({ category: currentCategory, content: bulletMatch[1].trim() });
    }
  }
  return entries;
}

/**
 * Append a new memory entry under the specified category (default: 'facts').
 *
 * Creates the file and/or section if they don't exist.
 * The entry is added as a `- <content>` bullet at the end of the section.
 * Never throws — returns `{ success: false, error }` on I/O failure.
 */
export function appendMemory(
  cwd: string,
  content: string,
  category: MemoryCategory = 'facts',
): MemoryResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: 'Memory content cannot be empty' };
  }

  const filePath = getMemoryPath(cwd);
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    raw = '# Project Memory\n';
  }

  const updated = appendToMarkdown(raw, trimmed, category);

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, updated, 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Clear all memory, or just one category if specified.
 * Writes back the template (`# Project Memory\n`) when clearing everything.
 * Never throws — returns `{ success: false, error }` on I/O failure.
 */
export function clearMemory(cwd: string, category?: MemoryCategory): MemoryResult {
  const filePath = getMemoryPath(cwd);

  if (!category) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '# Project Memory\n', 'utf-8');
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return { success: true };
  }

  const updated = removeSection(raw, category);
  try {
    fs.writeFileSync(filePath, updated, 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// --- internal helpers ------------------------------------------------------

/**
 * Insert a `- <content>` bullet at the end of the `## <category>` section.
 * If the section doesn't exist, create it at the right position (based on
 * MEMORY_CATEGORIES ordering) or at EOF.
 */
function appendToMarkdown(raw: string, content: string, category: MemoryCategory): string {
  const lines = raw.split('\n');
  const sectionHeader = `## ${category}`;

  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === sectionHeader) {
      sectionStart = i;
      break;
    }
  }

  if (sectionStart === -1) {
    const catOrder = MEMORY_CATEGORIES.indexOf(category);
    let insertAt = lines.length;
    for (let i = 0; i < lines.length; i++) {
      const m = /^## (\w+)/.exec(lines[i]);
      if (m) {
        const existingIdx = MEMORY_CATEGORIES.indexOf(m[1] as MemoryCategory);
        if (existingIdx > catOrder) {
          insertAt = i;
          break;
        }
      }
    }
    const newSection = [sectionHeader, `- ${content}`, ''];
    lines.splice(insertAt, 0, ...newSection);
    return lines.join('\n');
  }

  let insertAt = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      insertAt = i;
      break;
    }
  }

  while (insertAt > sectionStart + 1 && lines[insertAt - 1].trim() === '') {
    insertAt--;
  }

  lines.splice(insertAt, 0, `- ${content}`);
  return lines.join('\n');
}

/** Remove an entire `## <category>` section (header + bullets + trailing blanks). */
function removeSection(raw: string, category: MemoryCategory): string {
  const lines = raw.split('\n');
  const sectionHeader = `## ${category}`;
  const result: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (line.trim() === sectionHeader) {
      skipping = true;
      continue;
    }
    if (skipping && /^## /.test(line)) {
      skipping = false;
    }
    if (!skipping) result.push(line);
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
