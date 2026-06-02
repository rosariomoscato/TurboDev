# Permissions

Control what agents can do.

The permission system lets you manage which actions an agent can perform. You can configure permissions to allow, require approval, or deny specific operations.

## Permission Actions

| Action | Behavior |
|--------|----------|
| `allow` | Execute without asking |
| `ask` | Prompt user for approval before executing |
| `deny` | Block the action entirely |

## Default Permissions

| Agent | edit | bash |
|-------|------|------|
| editor | allow | allow |
| plan | ask | ask |

## Configuration

### In Markdown

Set permissions in the agent's frontmatter:

```yaml
permission:
  edit: deny
  bash: ask
```

### Bash Glob Patterns

For bash commands, you can set per-command permissions using glob patterns:

```yaml
permission:
  bash:
    "*": ask
    "git status": allow
    "git *": allow
    "rm *": deny
```

**Last matching rule wins.** Put general patterns first, specific patterns last.

#### Pattern Matching

| Pattern | Matches |
|---------|---------|
| `*` | Any command |
| `git *` | Any git command with arguments |
| `npm test` | Exactly `npm test` |
| `rm *` | Any rm command |

### Examples

#### Read-Only Agent

```yaml
permission:
  edit: deny
  bash: deny
```

The agent can read files but cannot modify anything or run commands.

#### Safe Development Agent

```yaml
permission:
  edit: ask
  bash:
    "*": ask
    "git status": allow
    "git diff": allow
    "npm test": allow
```

Edits and most commands require approval, but reading git status and running tests are allowed automatically.

#### Full Access Agent

```yaml
permission:
  edit: allow
  bash: allow
```

No approval needed — the agent can do everything. This is the default for the editor agent.

## Tool Override

Setting a tool to `false` in the `tools` config takes priority over permissions:

```yaml
tools:
  edit_file: false
permission:
  edit: allow    # This is ignored — edit_file is disabled
```

## Permission Flow

1. Agent attempts to use a tool
2. TurboDev checks if the tool is disabled (`tools: false`)
3. If not disabled, checks the permission action
4. If `ask`, shows a prompt to the user
5. If `deny`, returns an error to the agent
6. If `allow`, executes the tool immediately

### User Prompt

When `ask` is triggered:

```
? Allow edit_file?
  Command: editing src/app.ts
  [y/n]
```

Type `y` to allow, `n` to deny. The agent's response depends on your choice.

[Learn more about agents](/en/agents/)
