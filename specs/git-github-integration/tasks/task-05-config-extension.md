# Task 05: Config Extension

## Status

complete

## Wave

2

## Description

Extend the TurboDev config store to include GitHub authentication state. This allows the application to remember whether the user has completed GitHub auth setup and avoid re-prompting on every startup. The config file at `~/.turbodevrc` currently stores only `apiKey` and `model` — this task adds a `githubAuth` field.

## Dependencies

**Depends on:** None (Wave 1+ — no code dependency on other tasks)
**Blocks:** task-07-slash-commands.md

**Context from dependencies:** None. The config store is a standalone module.

## Files to Create

None.

## Files to Modify

- `src/config/store.ts` — Add `githubAuth` to `TurboDevConfig` interface, add helper functions

## Technical Details

### Current State

`src/config/store.ts` exports:
- `TurboDevConfig` interface with `apiKey?: string` and `model?: string`
- `loadConfig(): TurboDevConfig`
- `saveConfig(config: Partial<TurboDevConfig>): void`

### Changes

**Extend the interface:**

```typescript
export interface GithubAuthState {
  authenticated: boolean;
  username?: string;
  lastChecked?: string;  // ISO date string
}

export interface TurboDevConfig {
  apiKey?: string;
  model?: string;
  githubAuth?: GithubAuthState;
}
```

**Add helper functions:**

```typescript
export function getGithubAuthState(): GithubAuthState | null {
  const config = loadConfig();
  return config.githubAuth || null;
}

export function saveGithubAuthState(state: GithubAuthState): void {
  saveConfig({ githubAuth: state });
}
```

That's it — the existing `loadConfig` and `saveConfig` functions already handle the merge logic, so adding the new field requires only the type extension and two helper functions.

## Acceptance Criteria

- [ ] `TurboDevConfig` includes `githubAuth?: GithubAuthState`
- [ ] `GithubAuthState` has `authenticated`, `username?`, and `lastChecked?` fields
- [ ] `getGithubAuthState()` returns the stored auth state or null
- [ ] `saveGithubAuthState(state)` persists the auth state to `~/.turbodevrc`
- [ ] Existing config loading and saving continues to work (backward compatible)
- [ ] TypeScript compiles without errors

## Notes

- This is a small but important task — it enables Task 07 (App.tsx) to check and persist GitHub auth state
- The `lastChecked` field allows the app to re-verify auth periodically (e.g., after 24 hours)
