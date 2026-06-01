import fs from 'fs/promises';
import path from 'path';

export interface ListFilesArgs {
  path?: string;
}

export interface FileInfo {
  filename: string;
  type: 'file' | 'dir';
}

export interface ListFilesResult {
  path: string;
  files: FileInfo[];
}

/**
 * List files in a directory.
 * @param args - { path?: string } - Optional path, defaults to current directory
 * @returns { path: string, files: [{ filename: string, type: 'file'|'dir' }] }
 */
export async function listFilesTool(args: ListFilesArgs = {}): Promise<ListFilesResult> {
  const targetPath = args.path ? path.resolve(process.cwd(), args.path) : process.cwd();
  const entries = await fs.readdir(targetPath, { withFileTypes: true });

  const files: FileInfo[] = entries.map(entry => ({
    filename: entry.name,
    type: entry.isDirectory() ? 'dir' : 'file'
  }));

  return {
    path: targetPath,
    files
  };
}