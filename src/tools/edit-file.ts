import fs from 'fs/promises';
import path from 'path';

export interface EditFileArgs {
  path: string;
  old_str: string;
  new_str: string;
}

export interface EditFileResult {
  path: string;
  action: 'created' | 'edited' | 'not_found';
}

/**
 * Create or edit a file. If old_str is empty, creates the file with new_str.
 * Otherwise, finds the first occurrence of old_str and replaces it with new_str.
 * @param args - { path: string, old_str: string, new_str: string }
 * @returns { path: string, action: 'created'|'edited'|'not_found' }
 */
export async function editFileTool(args: EditFileArgs): Promise<EditFileResult> {
  const resolvedPath = path.resolve(process.cwd(), args.path);

  if (args.old_str === '') {
    await fs.writeFile(resolvedPath, args.new_str, 'utf-8');
    return { path: resolvedPath, action: 'created' };
  }

  const content = await fs.readFile(resolvedPath, 'utf-8');
  const index = content.indexOf(args.old_str);

  if (index === -1) {
    return { path: resolvedPath, action: 'not_found' };
  }

  const edited = content.replace(args.old_str, args.new_str);
  await fs.writeFile(resolvedPath, edited, 'utf-8');

  return { path: resolvedPath, action: 'edited' };
}