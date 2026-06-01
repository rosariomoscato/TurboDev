import fs from 'fs/promises';
import path from 'path';

export interface ReadFileArgs {
  filename: string;
}

export interface ReadFileResult {
  file_path: string;
  content: string;
}

/**
 * Read the full content of a file.
 * @param args - { filename: string } - The name of the file to read
 * @returns { file_path: string, content: string }
 */
export async function readFileTool(args: ReadFileArgs): Promise<ReadFileResult> {
  const resolvedPath = path.resolve(process.cwd(), args.filename);
  const content = await fs.readFile(resolvedPath, 'utf-8');
  return {
    file_path: resolvedPath,
    content
  };
}