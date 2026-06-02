# Task 01: Project Scaffolding

## Status

complete

## Wave

1

## Description

Set up the foundational Node.js project structure including package.json with all dependencies, TypeScript configuration, build setup with tsup, and a minimal CLI entry point skeleton. This task creates the build pipeline so all subsequent tasks can assume a working TypeScript project.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-04-llm-client, task-06-setup-wizard, task-07-chat-ui (depend on project structure and dependencies being installed)

**Context from dependencies:** No prior tasks exist. This is the first task and establishes the project foundation.

## Files to Create

- `package.json` — Project manifest with dependencies, scripts, and bin entry point
- `tsconfig.json` — TypeScript compiler configuration for JSX with React
- `tsup.config.ts` — tsup build configuration for ESM output
- `.gitignore` — Git ignore patterns (node_modules, dist, .env)
- `src/index.tsx` — Minimal CLI entry point skeleton (just a placeholder)

## Files to Modify

- None

## Technical Details

### Implementation Steps

1. Create `package.json` with the following structure:
   - Name: `turbodev`
   - Version: `0.1.0`
   - Type: `module`
   - Bin: `{ "turbodev": "./dist/index.js" }`
   - Dependencies: ink, react, ink-text-input, ink-spinner, ink-select-input, openai, chalk, @types/react, @types/node
   - DevDependencies: typescript, tsup, tsx
   - Scripts: `dev` (tsx watch), `build` (tsup), `start` (node dist/index.js)

2. Create `tsconfig.json` with:
   - Target: `ES2022`
   - Module: `ESNext`
   - JSX: `react-jsx`
   - ModuleResolution: `bundler`
   - AllowImportingTsExtensions: true
   - NoEmit: true (tsup handles emit)
   - Strict: true
   - SkipLibCheck: true

3. Create `tsup.config.ts`:
   - Entry: `src/index.tsx`
   - Format: `esm`
   - Target: `node18`
   - Clean: true
   - Banner: `#!/usr/bin/env node` at top (shebang for CLI execution)

4. Create `.gitignore` with standard Node.js patterns: `node_modules/`, `dist/`, `.env`, `*.log`

5. Create `src/index.tsx` as a minimal skeleton:
   ```typescript
   #!/usr/bin/env node
   
   console.log('TurboDev CLI - Initializing...');
   ```

### Code Snippets

**package.json structure:**
```json
{
  "name": "turbodev",
  "version": "0.1.0",
  "type": "module",
  "description": "Terminal-based AI coding agent",
  "bin": {
    "turbodev": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsx watch src/index.tsx",
    "build": "tsup",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ink": "^4.4.1",
    "react": "^18.2.0",
    "ink-text-input": "^5.0.1",
    "ink-spinner": "^5.0.0",
    "ink-select-input": "^5.0.0",
    "openai": "^4.20.1",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",
    "tsx": "^4.7.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**tsconfig.json structure:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  banner: {
    js: '#!/usr/bin/env node\n'
  },
  dts: false,
  shims: true,
});
```

### Environment Variables

- None used in this task

### API Endpoints

- None

## Acceptance Criteria

- [ ] `npm install` installs all dependencies without errors
- [ ] `npm run build` creates `dist/index.js` with shebang line
- [ ] `node dist/index.js` prints "TurboDev CLI - Initializing..."
- [ ] tsconfig.json supports JSX with React jsx runtime
- [ ] Package.json has correct bin entry for global installation
- [ ] .gitignore excludes node_modules, dist, and .env

## Notes

- The `ink` package uses React 18 with automatic JSX runtime, hence `jsx: "react-jsx"` in tsconfig
- tsup will handle the TypeScript compilation and ESM output
- The shebang in the banner ensures the built CLI file is executable
- This task is intentionally simple — the real logic comes in subsequent tasks