// ---------------------------------------------------------------------------
// Skills System — Skill Loader
// ---------------------------------------------------------------------------
// Reads SKILL.md files from disk, parses their YAML frontmatter with
// gray-matter, validates against the Agent Skills specification, and returns
// structured Skill objects.  Instructions are loaded lazily (progressive
// disclosure) via a separate function.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Skill, SkillMetadata, SkillSource } from './types.js';

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Skill name: 1–64 chars, lowercase alphanumeric with single hyphens between segments. */
const SKILL_NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Maximum allowed length for a skill name. */
const SKILL_NAME_MAX_LENGTH = 64;

/** Maximum allowed length for a skill description. */
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

/**
 * Validate a skill name against the Agent Skills specification.
 *
 * Rules:
 *  - 1–64 characters
 *  - Only lowercase alphanumeric and hyphens
 *  - Hyphens must not be leading, trailing, or consecutive
 *  - Must exactly match the parent directory name
 *
 * Returns `true` when the name is valid, `false` otherwise.
 */
function isValidSkillName(name: string, dirName: string): boolean {
  if (name.length < 1 || name.length > SKILL_NAME_MAX_LENGTH) return false;
  if (!SKILL_NAME_RE.test(name)) return false;
  if (name !== dirName) return false;
  return true;
}

/**
 * Validate a skill description against the Agent Skills specification.
 *
 * Rules:
 *  - Non-empty after trimming
 *  - Maximum 1024 characters
 *
 * Returns `true` when the description is valid, `false` otherwise.
 */
function isValidSkillDescription(description: string): boolean {
  if (!description || description.trim().length === 0) return false;
  if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a SKILL.md file and return a `Skill` with metadata only.
 *
 * This is the first stage of progressive disclosure — the Markdown body
 * (instructions) is NOT loaded and is set to `null`. Use `loadSkillInstructions`
 * to populate it later.
 *
 * Returns `null` on any I/O or validation error (silent failure).
 *
 * @param filePath - Absolute or relative path to the SKILL.md file.
 * @param source   - Where the skill was discovered (default `'project'`).
 */
export function parseSkillMarkdown(
  filePath: string,
  source: Skill['source'] = 'project'
): Skill | null {
  try {
    const resolved = path.resolve(filePath);

    // The skill directory name is the parent of the SKILL.md file.
    const dirName = path.basename(path.dirname(resolved));

    const raw = fs.readFileSync(resolved, 'utf-8');
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    // --- Required fields ---------------------------------------------------
    const name = data.name as string | undefined;
    const description = data.description as string | undefined;

    if (!name || !description) return null;
    if (!isValidSkillName(name, dirName)) return null;
    if (!isValidSkillDescription(description)) return null;

    // --- Build metadata (required + optional) ------------------------------
    const metadata: SkillMetadata = {
      name,
      description,
    };

    if (typeof data.license === 'string') metadata.license = data.license;
    if (typeof data.compatibility === 'string') metadata.compatibility = data.compatibility;
    if (typeof data.allowedTools === 'string') metadata.allowedTools = data.allowedTools;
    if (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)) {
      metadata.metadata = data.metadata as Record<string, string>;
    }

    return {
      name,
      metadata,
      instructions: null,
      basePath: path.dirname(resolved),
      source,
      enabled: true,
    };
  } catch {
    return null;
  }
}

/**
 * Load the full Markdown body (instructions) of a skill.
 *
 * Idempotent — if the skill already has instructions loaded, it is returned
 * as-is without re-reading the file.
 *
 * Returns a new `Skill` with `instructions` populated. On I/O errors, returns
 * the original skill unchanged (instructions remain `null`).
 *
 * @param skill - A skill object previously returned by `parseSkillMarkdown`.
 */
export function loadSkillInstructions(skill: Skill): Skill {
  // Already loaded — nothing to do.
  if (skill.instructions !== null) return skill;

  try {
    const skillMdPath = path.join(skill.basePath, 'SKILL.md');
    const raw = fs.readFileSync(skillMdPath, 'utf-8');
    const parsed = matter(raw);
    const body = parsed.content.trim();

    return {
      ...skill,
      instructions: body.length > 0 ? body : '',
    };
  } catch {
    return skill;
  }
}

/**
 * Read a resource file relative to the skill's base directory.
 *
 * Performs path traversal prevention by ensuring the resolved path remains
 * within the skill's `basePath`. Returns `null` if the path escapes the
 * skill directory or if the file cannot be read.
 *
 * @param skill        - A skill object with a valid `basePath`.
 * @param relativePath - Path to the resource, relative to the skill directory.
 */
export function loadSkillResource(
  skill: Skill,
  relativePath: string
): string | null {
  try {
    // Normalise both paths to prevent traversal attacks (e.g. "../../etc/passwd").
    const fullPath = path.resolve(skill.basePath, relativePath);
    const normalisedBase = path.resolve(skill.basePath);

    // The resolved path must start with the skill's base directory.
    // We add a trailing separator to prevent partial matches (e.g. /skills/foo
    // should not match /skills/foobar).
    if (
      fullPath !== normalisedBase &&
      !fullPath.startsWith(normalisedBase + path.sep)
    ) {
      return null;
    }

    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Scan a directory for skill subdirectories and parse each SKILL.md found.
 *
 * Non-directory entries and subdirectories without a SKILL.md are silently
 * skipped. Returns an empty array on I/O errors.
 *
 * @param dirPath - Path to the directory to scan (e.g. `.turbodev/skills`).
 * @param source  - Where the skills were discovered.
 */
export function loadSkillsFromDir(
  dirPath: string,
  source: Skill['source']
): Skill[] {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) return [];

  let entries: string[];
  try {
    entries = fs.readdirSync(resolved);
  } catch {
    return [];
  }

  const skills: Skill[] = [];

  for (const entry of entries) {
    const entryPath = path.join(resolved, entry);

    // Only process directories.
    try {
      const stat = fs.statSync(entryPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    const skillMdPath = path.join(entryPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;

    const skill = parseSkillMarkdown(skillMdPath, source);
    if (skill) skills.push(skill);
  }

  return skills;
}
