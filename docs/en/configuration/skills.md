# Agent Skills

Extend agent capabilities with installable skill packs.

Agent Skills are reusable instruction packs that teach agents how to perform specialized tasks. They follow the open [Agent Skills specification](https://agentskills.io) and are discovered automatically at startup.

## What are Skills?

A **skill** is a directory containing a `SKILL.md` file with YAML frontmatter metadata and Markdown instructions. When an agent encounters a task that matches a skill's description, it automatically loads the full instructions via the `load_skill` tool.

Skills use **progressive disclosure** to save tokens:

1. **Metadata** (~100 tokens) — always included in the system prompt so the LLM knows the skill exists
2. **Full instructions** — loaded on demand when the LLM calls `load_skill`
3. **Resource files** — additional files (references, scripts) loaded on demand via `load_skill` with a `resource` path

## Skill Sources

Skills are discovered from three sources, in priority order (higher overrides lower by name):

| Source | Location | Description |
|--------|----------|-------------|
| **Built-in** | Bundled with TurboDev | Skills shipped in the npm package |
| **Global** | `~/.config/turbodev/skills/` | User-installed skills, shared across all projects |
| **Project** | `<project>/.agents/skills/` | Project-specific skills, highest priority |

## Directory Structure

A skill directory follows this structure:

```
.agents/skills/
  my-skill/
    SKILL.md
    references/
      REFERENCE.md
    scripts/
      helper.sh
```

### SKILL.md Format

The `SKILL.md` file contains YAML frontmatter followed by Markdown instructions:

```markdown
---
name: my-skill
description: Description of what the skill does and when to use it.
license: MIT
compatibility: Node.js 18+
allowedTools: Bash(git:*) Read
metadata:
  author: "Your Name"
  version: "1.0.0"
---

# My Skill

Instructions for the agent go here. This content is loaded
when the agent calls `load_skill("my-skill")`.

You can reference additional files:

- See [Reference](references/REFERENCE.md) for detailed API docs
```

### Required Fields

| Field | Description |
|-------|-------------|
| `name` | Skill identifier. 1–64 chars, lowercase alphanumeric + hyphens. Must match the directory name. |
| `description` | Human-readable description of what the skill does. Max 1024 characters. |

### Optional Fields

| Field | Description |
|-------|-------------|
| `license` | License name or reference to a bundled license file |
| `compatibility` | Environment requirements (product, packages, network, etc.) |
| `allowedTools` | Space-separated pre-approved tools. Example: `Bash(git:*) Read` |
| `metadata` | Arbitrary key-value pairs for additional metadata |

## Enabling and Disabling Skills

By default, all discovered skills are enabled. Disable specific skills in your config:

```json
{
  "skills": {
    "disabled": ["skill-name-to-disable"]
  }
}
```

## Commands

- `/skills` — List all discovered skills with their status and source

## How it Works

1. At startup, TurboDev scans all three skill sources and merges them by name
2. Enabled skill metadata is included in the agent's system prompt
3. When the LLM decides a skill is relevant, it calls `load_skill` to get full instructions
4. If the skill references additional files, the LLM can load them via `load_skill` with a `resource` path

## Creating a Skill

To create a project-specific skill:

1. Create a directory under `.agents/skills/<skill-name>/`
2. Add a `SKILL.md` file with frontmatter and instructions
3. Optionally add reference files, scripts, or other resources
4. Restart TurboDev — the skill will be discovered automatically

[Learn more about tools](/en/agents/tools)
