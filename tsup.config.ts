import { defineConfig } from 'tsup';
import { execSync } from 'child_process';

function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  banner: {
    js: '#!/usr/bin/env node'
  },
  dts: false,
  shims: false,
  define: {
    '__GIT_HASH__': JSON.stringify(getGitHash()),
  },
});