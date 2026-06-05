import fs from 'fs/promises';
import path from 'path';

export interface ListFilesArgs {
  path?: string;
  recursive?: boolean;
}

export interface FileInfo {
  filename: string;
  type: 'file' | 'dir';
}

export interface ListFilesResult {
  path: string;
  files: FileInfo[];
}

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', '.next', '.turbodev', 'coverage', '.cache',
]);

export async function listFilesTool(args: ListFilesArgs = {}): Promise<ListFilesResult> {
  const targetPath = args.path ? path.resolve(process.cwd(), args.path) : process.cwd();

  if (args.recursive) {
    const files = await listRecursive(targetPath, targetPath);
    return { path: targetPath, files };
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const files: FileInfo[] = entries
    .filter(e => !IGNORED_DIRS.has(e.name) && !e.name.startsWith('.'))
    .map(entry => ({
      filename: entry.name,
      type: entry.isDirectory() ? 'dir' : 'file'
    }));

  return { path: targetPath, files };
}

async function listRecursive(basePath: string, currentPath: string): Promise<FileInfo[]> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const results: FileInfo[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    if (entry.isDirectory()) {
      results.push({ filename: relativePath, type: 'dir' });
      const subFiles = await listRecursive(basePath, fullPath);
      results.push(...subFiles);
    } else {
      results.push({ filename: relativePath, type: 'file' });
    }
  }

  return results;
}