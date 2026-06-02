# AGENTS.md

Project context file for TurboDev.

`AGENTS.md` is a Markdown file that provides project context to TurboDev's AI agents. It helps the agent understand your project's structure, conventions, and requirements.

## Creating AGENTS.md

### Interactive Wizard

Use the `/init` command inside TurboDev:

```
/init
```

This launches an interactive wizard that:

1. Detects your project type (Node.js, Python, Rust, Go)
2. Lets you choose which sections to include
3. Generates the file automatically

### Sections

The wizard can generate these sections:

| Section | Description |
|---------|-------------|
| **Project Overview** | General project description |
| **Setup Commands** | Install, build, dev commands (auto-detected) |
| **Code Style** | Linting and formatting conventions |
| **Testing Instructions** | How to run tests (auto-detected) |
| **Design** | UI patterns, color palette, typography |
| **Security Considerations** | Security guidelines |
| **Deployment Notes** | Deployment instructions |

### Manual Creation

Create `AGENTS.md` in your project root:

```markdown
# AGENTS.md

## Project Overview

My awesome project — a REST API built with Express and TypeScript.

## Setup Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`

## Code Style

- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Run linting before committing

## Testing Instructions

- Run tests: `npm test`
- Fix any test failures before committing
```

## How It Works

TurboDev loads `AGENTS.md` content into the system prompt, giving the AI agent context about:

- What your project does
- How to build and test it
- Your coding conventions
- What tools and frameworks you use

::: tip
Commit `AGENTS.md` to your repository so all team members benefit from consistent AI context.
:::

## File Location

TurboDev looks for `AGENTS.md` in the **current working directory** (where you launch TurboDev).

If no `AGENTS.md` is found, TurboDev shows a notice at startup. You can create one anytime with `/init`.

## After Creating

If you create `AGENTS.md` during a session (via `/init`), TurboDev immediately loads the new context — no restart needed.
