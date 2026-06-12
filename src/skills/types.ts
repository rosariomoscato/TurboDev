// ---------------------------------------------------------------------------
// Skills System — Core Types & Interfaces
// ---------------------------------------------------------------------------
// Follows the Agent Skills specification: https://agentskills.io/specification
// These types are self-contained with no imports from other modules.
// ---------------------------------------------------------------------------

/**
 * Metadata parsed from the YAML frontmatter of a SKILL.md file.
 *
 * Only `name` and `description` are required by the spec. All other fields
 * are optional and provide additional context about the skill.
 *
 * @see https://agentskills.io/specification
 */
export interface SkillMetadata {
  /** Skill identifier. 1–64 chars, lowercase alphanumeric + hyphens. Must match the skill directory name. */
  name: string;

  /** Human-readable description of what the skill does and when to use it. Max 1024 characters. */
  description: string;

  /** License name or reference to a bundled license file. */
  license?: string;

  /** Environment requirements (intended product, system packages, network access, etc.). Max 500 characters. */
  compatibility?: string;

  /** Arbitrary key-value pairs for additional metadata not defined by the spec. */
  metadata?: Record<string, string>;

  /**
   * Space-separated string of pre-approved tools the skill may use.
   * Experimental — support varies between agent implementations.
   * Example: "Bash(git:*) Bash(jq:*) Read"
   */
  allowedTools?: string;
}

/**
 * Where the skill was discovered. This determines precedence and whether
 * the skill is user-editable.
 */
export type SkillSource = 'project' | 'global' | 'builtin';

/**
 * A fully resolved skill object.
 *
 * Created by the skill loader after parsing a SKILL.md file and resolving
 * its location. This is the canonical representation used throughout the
 * system — from discovery through to tool invocation.
 */
export interface Skill {
  /** Unique skill name (same as `metadata.name`). */
  name: string;

  /** Frontmatter metadata parsed from the SKILL.md file. */
  metadata: SkillMetadata;

  /**
   * The Markdown body (instructions) from the SKILL.md file, or `null` if
   * only metadata has been loaded (progressive disclosure — first stage).
   */
  instructions: string | null;

  /** Absolute path to the skill's root directory on disk. */
  basePath: string;

  /** Where the skill was discovered: project-level, user-global, or built-in. */
  source: SkillSource;

  /** Whether the skill is currently active and available for use. */
  enabled: boolean;
}

/**
 * Arguments for the `load_skill` tool.
 *
 * Used by the LLM to request full instructions or a specific resource file
 * from a skill (progressive disclosure — second/third stage).
 */
export interface LoadSkillArgs {
  /** Name of the skill to load. */
  name: string;

  /**
   * Optional relative path to a resource file within the skill directory
   * (e.g. "references/REFERENCE.md", "scripts/analyze.py").
   * When omitted, the full skill instructions are returned.
   */
  resource?: string;
}

/**
 * Result returned by the `load_skill` tool.
 *
 * On success, includes the skill instructions and optionally a resource
 * file's content. On failure, contains an error message explaining what
 * went wrong.
 */
export interface LoadSkillResult {
  /** Whether the load operation succeeded. */
  success: boolean;

  /** Name of the skill that was requested. */
  name: string;

  /** Full skill instructions (the SKILL.md body), returned on success when no resource is requested. */
  instructions?: string;

  /** Relative path of the resource that was requested, if any. */
  resource?: string;

  /** Content of the requested resource file, returned on success when a resource path is provided. */
  resourceContent?: string;

  /** Error message explaining why the load failed, if `success` is `false`. */
  error?: string;
}
