// ---------------------------------------------------------------------------
// Skills System — Skill Discovery & Lifecycle
// ---------------------------------------------------------------------------
// Loads skills from three sources in priority order (builtin → global →
// project), merging by name so that higher-priority sources override lower
// ones.  Respects the disabled list from the user config.
// ---------------------------------------------------------------------------

import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadSkillsFromDir } from './loader.js';
import { loadConfig } from '../config/store.js';
import type { Skill } from './types.js';

// ESM-safe __dirname equivalent (Node 18 compatible).
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Discover and load all skills from every source.
 *
 * Resolution order (later sources override earlier ones by name):
 *   1. **builtin**  — skills shipped with TurboDev (`src/skills/builtin/`)
 *   2. **global**   — user-installed skills (`~/.config/turbodev/skills/`)
 *   3. **project**  — project-specific skills (`<cwd>/.agents/skills/`)
 *
 * After merging, any skill whose name appears in `config.skills.disabled` is
 * marked with `enabled: false`.
 *
 * @param cwd - Absolute path to the current working directory (project root).
 * @returns Array of all discovered skills (enabled and disabled).
 */
export function loadAllSkills(cwd: string): Skill[] {
  const skillMap = new Map<string, Skill>();

  // 1. Built-in skills (lowest priority — shipped with TurboDev).
  const builtinDir = path.join(__dirname, 'builtin');
  const builtinSkills = loadSkillsFromDir(builtinDir, 'builtin');
  for (const skill of builtinSkills) {
    skillMap.set(skill.name, skill);
  }

  // 2. Global skills (user-level, shared across projects).
  const globalDir = path.join(os.homedir(), '.config', 'turbodev', 'skills');
  const globalSkills = loadSkillsFromDir(globalDir, 'global');
  for (const skill of globalSkills) {
    // Global overrides builtin when names collide.
    skillMap.set(skill.name, skill);
  }

  // 3. Project skills (highest priority — workspace-specific).
  const projectDir = path.join(cwd, '.agents', 'skills');
  const projectSkills = loadSkillsFromDir(projectDir, 'project');
  for (const skill of projectSkills) {
    // Project overrides everything when names collide.
    skillMap.set(skill.name, skill);
  }

  // Apply the disabled list from user configuration.
  const disabled = loadConfig().skills?.disabled;
  if (disabled && disabled.length > 0) {
    const disabledSet = new Set(disabled);
    for (const [name, skill] of skillMap) {
      if (disabledSet.has(name)) {
        skillMap.set(name, { ...skill, enabled: false });
      }
    }
  }

  return Array.from(skillMap.values());
}

/**
 * Format skill metadata as a human-readable string.
 *
 * Produces one line per enabled skill in the format:
 * ```
 * - skill-name: Description of what the skill does.
 * ```
 *
 * Disabled skills are excluded. Returns an empty string when no enabled
 * skills are available.
 *
 * @param skills - Array of skills (typically from `loadAllSkills`).
 * @returns Formatted multi-line string, or `''` if no skills are enabled.
 */
export function formatSkillMetadata(skills: Skill[]): string {
  const enabled = skills.filter((s) => s.enabled);
  if (enabled.length === 0) return '';

  return enabled
    .map((s) => `- ${s.name}: ${s.metadata.description}`)
    .join('\n');
}
