# Task 02: Config Store

## Status

complete

## Wave

1

## Description

Implement configuration management for TurboDev that reads from and writes to `~/.turbodevrc`. The config stores the user's OpenRouter API key and selected model. This task creates a reusable store module that all other tasks will import from when they need configuration.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-04-llm-client (needs API key from config), task-06-setup-wizard (needs to save config after setup)

**Context from dependencies:** No prior tasks exist. This task creates a standalone utility module.

## Files to Create

- `src/config/store.ts` — Config read/write functions and TypeScript interfaces

## Files to Modify

- None

## Technical Details

### Implementation Steps

1. Define TypeScript interface for config:
   ```typescript
   interface TurboDevConfig {
     apiKey?: string;
     model?: string;
   }
   ```

2. Implement `getConfigPath()` to return `~/.turbodevrc`:
   - Use `os.homedir()` from Node.js stdlib
   - Return `Path.join(homedir, '.turbodevrc')`

3. Implement `loadConfig()` function:
   - Check if config file exists using `fs.existsSync()`
   - If not exists, return empty object `{}` (partial config)
   - If exists, read file using `fs.readFileSync()` with UTF-8
   - Parse JSON and return as `TurboDevConfig`
   - Handle JSON parse errors by returning empty object

4. Implement `saveConfig(config)` function:
   - Accept `Partial<TurboDevConfig>` (allows partial updates)
   - Load existing config
   - Merge with new config (spread operator, new values override)
   - Write to file using `fs.writeFileSync()` with UTF-8
   - Pretty-print JSON with 2-space indentation

5. Export functions and interface

### Code Snippets

**Full src/config/store.ts:**
```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TurboDevConfig {
  apiKey?: string;
  model?: string;
}

function getConfigPath(): string {
  return path.join(os.homedir(), '.turbodevrc');
}

export function loadConfig(): TurboDevConfig {
  const configPath = getConfigPath();
  
  if (!fs.existsSync(configPath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading config file:', error);
    return {};
  }
}

export function saveConfig(config: Partial<TurboDevConfig>): void {
  const configPath = getConfigPath();
  const existing = loadConfig();
  const merged = { ...existing, ...config };
  
  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(merged, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
  }
}
```

### Environment Variables

- None

### API Endpoints

- None

## Acceptance Criteria

- [ ] `loadConfig()` returns empty object when `~/.turbodevrc` doesn't exist
- [ ] `loadConfig()` correctly parses existing config file
- [ ] `saveConfig({ apiKey: 'sk-...' })` creates `~/.turbodevrc` with valid JSON
- [ ] `saveConfig()` merges with existing config (partial update)
- [ ] Config file is pretty-printed with 2-space indentation
- [ ] TypeScript types enforce `TurboDevConfig` interface

## Notes

- Config file format is simple JSON with no nesting or validation
- Partial config is allowed (user may have API key but no model yet, which triggers setup wizard to ask for model)
- Errors during config write are logged and re-thrown to surface issues to user
- Use `os.homedir()` (Node 18+) for cross-platform home directory resolution