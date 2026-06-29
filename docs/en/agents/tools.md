# Tools

Tools available to TurboDev agents.

Agents have access to a set of tools for interacting with your codebase. Tool availability can be controlled per-agent via the `tools` configuration.

## Reference

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands |
| `edit_file` | Create or edit files |
| `git` | Execute Git operations |
| `github` | Execute GitHub operations |
| `grep` | Search file contents with regex |
| `list_files` | List directory contents |
| `mkdir` | Create directories |
| `question` | Ask the user a question |
| `read_file` | Read file contents |
| `load_skill` | Load skill instructions or resource files |
| `task` | Invoke a subagent |

## read_file

Read the full content of a file.

**Args**: `{ path: string }`

```
read_file({ "path": "src/index.ts" })
```

## edit_file

Create or edit a file. If `old_str` is empty, creates the file with `new_str`. Otherwise, finds and replaces the first occurrence of `old_str` with `new_str`.

**Args**: `{ path: string, old_str: string, new_str: string }`

```
edit_file({ "path": "src/app.ts", "old_str": "hello", "new_str": "world" })
```

## list_files

List files and directories in a given path.

**Args**: `{ path?: string }` (defaults to current directory)

```
list_files({ "path": "src" })
```

## mkdir

Create a new directory, including parent directories.

**Args**: `{ path: string }`

```
mkdir({ "path": "src/components/ui" })
```

## grep

Search file contents using regular expressions.

**Args**: `{ pattern: string, include?: string, path?: string }`

```
grep({ "pattern": "TODO", "include": "*.ts" })
```

## bash

Execute a shell command and return output.

**Args**: `{ command: string, timeout?: number, workdir?: string }`

```
bash({ "command": "npm test", "timeout": 60000 })
```

## question

Ask the user a question and wait for their response.

**Args**: `{ question: string, options?: string[] }`

```
question({ "question": "Which framework?", "options": ["react", "vue"] })
```

## load_skill

Load full instructions or a specific resource file from an agent skill. The LLM calls this automatically when it determines a skill is relevant to the current task.

**Args**: `{ name: string, resource?: string }`

```
load_skill({ "name": "react-component" })
load_skill({ "name": "react-component", "resource": "references/patterns.md" })
```

When `resource` is omitted, returns the full SKILL.md instructions. When provided, returns the content of the specified file within the skill directory.

::: tip
This tool is always enabled and cannot be disabled per-agent. The LLM only has access to skill metadata in the system prompt until it calls `load_skill`.
:::

## task

Invoke a subagent for a specialized task.

**Args**: `{ agent: string, prompt: string, description: string }`

```
task({ "agent": "explore", "prompt": "find all API routes", "description": "Explore API routes" })
```

::: warning
The `task` tool is disabled for the plan agent by default.
:::

## git

Execute Git operations via simple-git. Supports 26 operations including status, log, diff, add, commit, push, pull, branch, stash, remote, and more.

**Args**: `{ operation: string, args?: any }`

```
git({ "operation": "status" })
git({ "operation": "log", "args": { "maxCount": 10 } })
git({ "operation": "commit", "args": { "message": "fix: resolve bug" } })
```

Available operations: `status`, `log`, `diff`, `add`, `commit`, `push`, `pull`, `branch`, `checkout`, `stash`, `remote`, `fetch`, `reset`, `revert`, `tag`, `merge`, `rebase`, `init`, `clone`, `addRemote`, `removeRemote`, `listRemotes`, `raw`, `diffSummary`, `show`, `clean`.

::: danger
Git operations that modify the repository (commit, push, reset, revert, clean, etc.) require explicit permission from the user.
:::

## github

Execute GitHub operations via the `gh` CLI. Supports 15 operations including PR management, issues, releases, and authentication.

**Args**: `{ operation: string, args?: any }`

```
github({ "operation": "createPr", "args": { "title": "Fix bug", "body": "Description" } })
github({ "operation": "listPrs" })
github({ "operation": "createIssue", "args": { "title": "Bug report", "body": "Steps to reproduce" } })
```

Available operations: `authStatus`, `createPr`, `listPrs`, `viewPr`, `mergePr`, `closePr`, `createIssue`, `listIssues`, `closeIssue`, `createRelease`, `listReleases`, `repoView`, `repoClone`, `runList`, `runView`.

Requires the [GitHub CLI (`gh`)](https://cli.github/) to be installed and authenticated. Run `/gh auth` to set up authentication.

## Controlling Tool Access

Tools can be enabled or disabled per-agent in the Markdown configuration:

```yaml
tools:
  edit_file: false
  bash: false
  task: false
```

When a tool is disabled (`false`), the agent receives an error if it tries to use it: `Tool "edit_file" is denied for agent "plan"`.

## MCP Tools (dynamic)

In addition to the native tools above, agents can invoke **MCP tools** registered dynamically from external MCP servers declared in `.turbodev/mcp.json`. These tools appear automatically in the system prompt when at least one server is connected.

MCP tool names follow the convention `mcp__<server>__<tool>` — for example, a `filesystem` server exposing a `read_file` tool is callable as:

```
tool: mcp__filesystem__read_file({"path": "/tmp/example.txt"})
```

MCP tools are not listed in the `tools:` config (they're dynamic). To disable a specific MCP tool, use its full prefixed name:

```yaml
tools:
  "mcp__filesystem__delete": false
```

Permissions for MCP tools default to `ask` and are configured via `permission.mcp`. See [Permissions](/en/agents/permissions#mcp-tools) and [MCP configuration](/en/configuration/mcp) for details.

[Learn more about permissions](/en/agents/permissions)
