# Agents

Configure and use specialized agents.

Agents are specialized AI assistants that you can configure for specific tasks and workflows. They allow you to create targeted tools with custom prompts, models, and tool access.

::: tip
Use the **plan** agent to analyze code and evaluate suggestions without making any changes to the codebase.
:::

You can switch between agents during a session using **Tab**, select them via the `/agent` command, or invoke them with `@mention`.

---

## Types

TurboDev has two types of agents: primary agents and subagents.

### Primary Agents

Primary agents are the main assistants you interact with directly. You can cycle through them using **Tab**. These agents handle the main conversation. Tool access is configured via permissions: for example, editor has all tools enabled, while plan is restricted.

::: tip
Use **Tab** to switch between primary agents during a session.
:::

TurboDev includes two primary agents: **editor** and **plan**.

### Subagents

Subagents are specialized assistants that primary agents can invoke for specific tasks. You can also invoke them manually by **@mentioning** them in your messages.

---

## Built-in Agents

### Editor

*Mode*: `primary` · *Color*: `cyan`

Editor is the **default** primary agent with all tools enabled. It's the standard agent for development work when you need full access to file operations and system commands.

**Tools**: All enabled
**Permissions**: `edit: allow`, `bash: allow`

### Plan

*Mode*: `primary` · *Color*: `yellow`

A restricted agent designed for planning and analysis. It uses a permission system to give you more control and prevent unintended modifications. By default:

- `edit`: **ask** — requests approval before editing files
- `bash`: **ask** — requests approval before running commands

**Tools**: All enabled except `task`
**Permissions**: `edit: ask`, `bash: ask`

---

## Usage

1. **Primary agents**: Use **Tab** to cycle through them. Or type `/agent` to open the selector.

2. **@mention**: Invoke any agent directly by mentioning it:
   ```
   @plan analyze the authentication flow
   ```

3. **Subagent invocation**: Primary agents can automatically invoke subagents for specialized tasks.

---

## Configuration

Agents can be defined using Markdown files. Place them in:

- **Global**: `~/.config/turbodev/agents/`
- **Per-project**: `.turbodev/agents/`

The Markdown filename becomes the agent name. For example, `review.md` creates an agent named `review`.

### Example

`.turbodev/agents/reviewer.md`:

```markdown
---
description: Code reviewer that analyzes code without modifying it
mode: primary
tools:
  edit_file: false
  mkdir: false
  bash: false
permission:
  edit: deny
  bash: deny
color: green
---
You are a code reviewer agent. Your job is to:
- Read and analyze code
- Identify potential bugs, security issues, and style problems
- Suggest improvements without making changes
Never attempt to modify any files.
```

### Merge Order

When a custom agent file has the same name as a built-in agent (e.g., `editor.md`), TurboDev performs a **shallow merge**:

- Built-in ← Global ← Project (project wins)
- Only specified fields are overridden
- The built-in `name` is always preserved

---

## Options

### description

A brief description of what the agent does and when to use it.

```yaml
description: Reviews code for best practices and potential issues
```

**Required.**

### temperature

Controls randomness and creativity of responses.

| Range | Behavior |
|-------|----------|
| 0.0–0.2 | Focused, deterministic — ideal for analysis |
| 0.3–0.5 | Balanced — general development |
| 0.6–1.0 | Creative — brainstorming and exploration |

```yaml
temperature: 0.1
```

### top_p

Alternative to temperature for controlling response diversity. Values from 0.0 to 1.0.

```yaml
top_p: 0.9
```

### steps

Maximum number of agentic iterations before forcing a text-only response. Useful for controlling costs.

```yaml
steps: 25
```

### model

Override the model for this agent. Useful for using different models optimized for different tasks.

```yaml
model: anthropic/claude-haiku-4-20250514
```

### mode

Determines how the agent can be used: `primary`, `subagent`, or `all`. Default is `all`.

```yaml
mode: primary
```

### prompt

Custom system prompt for the agent. Written as the Markdown body (after the frontmatter).

````markdown
---
description: Fast planner
mode: primary
---
You are a planning specialist. Be concise and direct.
````

### tools

Enable or disable specific tools for this agent.

```yaml
tools:
  edit_file: false
  mkdir: false
  bash: false
```

### permission

Configure what actions the agent can perform.

```yaml
permission:
  edit: deny
  bash: ask
```

For bash, you can use glob patterns:

```yaml
permission:
  bash:
    "*": ask
    "git status": allow
    "git *": allow
```

::: tip
Rules are evaluated in order and **the last matching rule wins**. Put general patterns first, specific patterns last.
:::

[Learn more about permissions](/en/agents/permissions)

### taskPermission

Controls which subagents this agent can invoke via the task tool. Uses glob patterns.

```yaml
taskPermission:
  "*": deny
  "code-reviewer": allow
```

### color

Visual appearance in the terminal UI. Use a valid color name: `cyan`, `yellow`, `green`, `red`, `magenta`, `blue`, `white`, `gray`.

```yaml
color: green
```

### hidden

Hide a subagent from the autocomplete menu. Useful for internal agents that should only be invoked programmatically.

```yaml
hidden: true
```

### disable

Completely disable an agent so it doesn't appear anywhere.

```yaml
disable: true
```

---

## Use Cases

- **Editor agent**: Full development with all tools enabled
- **Plan agent**: Analysis and planning without modifications
- **Review agent**: Code review with read-only access
- **Debug agent**: Focused investigation with bash and read tools
- **Docs agent**: Writing documentation with file operations but no system commands

---

## Examples

### Documentation Writer

`.turbodev/agents/docs-writer.md`:

```markdown
---
description: Writes and maintains project documentation
mode: subagent
tools:
  bash: false
color: magenta
---
You are a technical writer. Create clear, comprehensive documentation.
Focus on:
- Clear explanations
- Proper structure
- Code examples
- User-friendly language
```

### Security Auditor

`.turbodev/agents/security-auditor.md`:

```markdown
---
description: Performs security audits and identifies vulnerabilities
mode: subagent
tools:
  edit_file: false
  bash: false
permission:
  edit: deny
  bash: deny
color: red
---
You are a security expert. Focus on identifying potential security issues.
Look for:
- Input validation vulnerabilities
- Authentication and authorization flaws
- Data exposure risks
- Dependency vulnerabilities
- Configuration security issues
```
