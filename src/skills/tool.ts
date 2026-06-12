// ---------------------------------------------------------------------------
// Skills System — load_skill Tool Implementation
// ---------------------------------------------------------------------------
// Implements the `load_skill` tool that the LLM calls to load full skill
// instructions or a specific resource file (progressive disclosure stages
// 2 and 3).  Validates the requested skill exists and is enabled before
// loading any content from disk.
// ---------------------------------------------------------------------------

import { loadSkillInstructions, loadSkillResource } from './loader.js';
import type { LoadSkillArgs, LoadSkillResult, Skill } from './types.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Execute the `load_skill` tool.
 *
 * Flow:
 *   1. Look up the skill by name in the provided array.
 *   2. Reject unknown or disabled skills with a descriptive error.
 *   3. Load the full Markdown body (instructions) via `loadSkillInstructions`.
 *   4. If `args.resource` is provided, load that file from the skill directory.
 *
 * @param args   - Tool arguments (skill name + optional resource path).
 * @param skills - The full list of discovered skills (from `loadAllSkills`).
 * @returns A `LoadSkillResult` with instructions/resource content on success,
 *          or an error message on failure.
 */
export async function loadSkillTool(
  args: LoadSkillArgs,
  skills: Skill[]
): Promise<LoadSkillResult> {
  const skill = skills.find((s) => s.name === args.name);

  // --- Skill not found --------------------------------------------------
  if (!skill) {
    return {
      success: false,
      name: args.name,
      error: `Unknown skill: "${args.name}". Use the available skills listed in your system prompt.`,
    };
  }

  // --- Skill is disabled ------------------------------------------------
  if (!skill.enabled) {
    return {
      success: false,
      name: args.name,
      error: `Skill "${args.name}" is currently disabled.`,
    };
  }

  // --- Load full instructions (progressive disclosure — stage 2) --------
  const loaded = loadSkillInstructions(skill);

  // --- Optionally load a resource file (progressive disclosure — stage 3)
  if (args.resource) {
    const resourceContent = loadSkillResource(loaded, args.resource);

    if (resourceContent === null) {
      return {
        success: false,
        name: args.name,
        resource: args.resource,
        error: `Failed to load resource "${args.resource}" from skill "${args.name}". The file may not exist or the path may be invalid.`,
      };
    }

    return {
      success: true,
      name: args.name,
      instructions: loaded.instructions ?? undefined,
      resource: args.resource,
      resourceContent,
    };
  }

  // --- Return instructions only (no resource requested) -----------------
  return {
    success: true,
    name: args.name,
    instructions: loaded.instructions ?? undefined,
  };
}
