import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export interface GrepArgs {
  pattern: string;
  include?: string;
  path?: string;
}

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

export interface GrepResult {
  matches: GrepMatch[];
  total: number;
  truncated: boolean;
}

const MAX_RESULTS = 50;
const MAX_PATTERN_LENGTH = 200;
const DEFAULT_TIMEOUT_MS = 30000;

// Directories to always skip during manual fallback traversal
const SKIP_DIRS = new Set(['node_modules', '.git', '.svn', '.hg']);

/**
 * Check whether ripgrep (`rg`) is available on the system PATH.
 */
function isRipgrepAvailable(): boolean {
  try {
    execSync('rg --version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Perform a search using ripgrep and parse its output.
 *
 * Output format per line: `{file}:{line_number}:{content}`
 */
function searchWithRipgrep(
  pattern: string,
  searchPath: string,
  include?: string
): GrepMatch[] {
  const args: string[] = [
    'rg',
    '--line-number',
    '--no-heading',
    '--color', 'never',
  ];

  if (include) {
    args.push('-g', include);
  }

  args.push(pattern, searchPath);

  const output = execSync(args.join(' '), {
    encoding: 'utf-8',
    timeout: DEFAULT_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024, // 10 MB
  });

  const matches: GrepMatch[] = [];

  if (!output.trim()) {
    return matches;
  }

  const lines = output.split('\n');
  for (const line of lines) {
    if (!line) continue;
    // Format: file:line_number:content
    const firstColon = line.indexOf(':');
    if (firstColon === -1) continue;
    const secondColon = line.indexOf(':', firstColon + 1);
    if (secondColon === -1) continue;

    const file = line.substring(0, firstColon);
    const lineNum = parseInt(line.substring(firstColon + 1, secondColon), 10);
    const content = line.substring(secondColon + 1);

    if (!isNaN(lineNum)) {
      matches.push({ file, line: lineNum, content });
    }
  }

  return matches;
}

/**
 * Simple glob matcher supporting patterns like "*.ts" and "*.{ts,tsx}".
 */
function matchesGlob(filename: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    // Handle brace expansion: *.{ts,tsx}
    if (pattern.includes('{')) {
      const exts = pattern.match(/\{([^}]+)\}/)?.[1].split(',') || [];
      return exts.some((e) => filename.endsWith(e.trim()));
    }
    // Simple wildcard: *.ts
    const ext = pattern.slice(1); // e.g. ".ts"
    return filename.endsWith(ext);
  }
  // No recognised pattern — accept everything
  return true;
}

/**
 * Recursively walk a directory, collecting file paths that match the include filter.
 * Skips hidden directories and common dependency directories.
 */
async function walkDir(
  dir: string,
  includePattern?: string
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    // Skip hidden entries and known dependency dirs
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walkDir(fullPath, includePattern));
    } else if (entry.isFile()) {
      if (!includePattern || matchesGlob(entry.name, includePattern)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Manual fallback search when ripgrep is not available.
 * Walks the directory tree, reads each matching file, and applies a RegExp search.
 */
async function searchManually(
  pattern: string,
  searchPath: string,
  include?: string
): Promise<GrepMatch[]> {
  const files = await walkDir(searchPath, include);
  const regex = new RegExp(pattern);
  const matches: GrepMatch[] = [];

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          matches.push({
            file: path.relative(searchPath, filePath) || filePath,
            line: i + 1, // 1-based line numbers
            content: lines[i],
          });

          // Stop collecting early if we already have more than we need
          if (matches.length > MAX_RESULTS) {
            return matches;
          }
        }
      }
    } catch {
      // Binary files, permission errors, etc. — skip silently
      continue;
    }
  }

  return matches;
}

/**
 * Search file contents using a regex pattern.
 * Uses ripgrep (`rg`) when available, otherwise falls back to a manual walk + RegExp.
 * @param args - { pattern: string, include?: string, path?: string }
 * @returns { matches: GrepMatch[], total: number, truncated: boolean }
 */
export async function grepTool(args: GrepArgs): Promise<GrepResult> {
  const searchPath = args.path
    ? path.resolve(process.cwd(), args.path)
    : process.cwd();

  // Validate that the search path exists and is a directory
  try {
    const stat = await fs.stat(searchPath);
    if (!stat.isDirectory()) {
      return { matches: [], total: 0, truncated: false };
    }
  } catch {
    // Path does not exist
    return { matches: [], total: 0, truncated: false };
  }

  if (args.pattern.length > MAX_PATTERN_LENGTH) {
    return { matches: [], total: 0, truncated: false };
  }

  // Validate the regex pattern
  try {
    new RegExp(args.pattern);
  } catch {
    return { matches: [], total: 0, truncated: false };
  }

  // Choose search strategy
  const useRg = isRipgrepAvailable();
  const allMatches = useRg
    ? searchWithRipgrep(args.pattern, searchPath, args.include)
    : await searchManually(args.pattern, searchPath, args.include);

  // When using ripgrep, make file paths relative to the search directory
  if (useRg) {
    for (const match of allMatches) {
      const rel = path.relative(searchPath, match.file);
      if (rel) {
        match.file = rel;
      }
    }
  }

  const total = allMatches.length;
  const truncated = total > MAX_RESULTS;
  const matches = allMatches.slice(0, MAX_RESULTS);

  return { matches, total, truncated };
}
