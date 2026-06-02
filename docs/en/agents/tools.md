# Tools

Tools available to TurboDev agents.

Agents have access to a set of tools for interacting with your codebase. Tool availability can be controlled per-agent via the `tools` configuration.

## Reference

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `edit_file` | Create or edit files |
| `list_files` | List directory contents |
| `mkdir` | Create directories |
| `grep` | Search file contents with regex |
| `bash` | Execute shell commands |
| `question` | Ask the user a question |
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

## task

Invoke a subagent for a specialized task.

**Args**: `{ agent: string, prompt: string, description: string }`

```
task({ "agent": "explore", "prompt": "find all API routes", "description": "Explore API routes" })
```

::: warning
The `task` tool is disabled for the plan agent by default.
:::

## Controlling Tool Access

Tools can be enabled or disabled per-agent in the Markdown configuration:

```yaml
tools:
  edit_file: false
  bash: false
  task: false
```

When a tool is disabled (`false`), the agent receives an error if it tries to use it: `Tool "edit_file" is denied for agent "plan"`.

[Learn more about permissions](/en/agents/permissions)
