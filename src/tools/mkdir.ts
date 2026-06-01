import fs from 'fs/promises';
import path from 'path';

export interface MkdirArgs {
  path: string;
}

export interface MkdirResult {
  path: string;
  action: 'created' | 'exists' | 'error';
}

export async function mkdirTool(args: MkdirArgs): Promise<MkdirResult> {
  const resolvedPath = path.resolve(process.cwd(), args.path);
  
  try {
    await fs.mkdir(resolvedPath, { recursive: true });
    return { path: resolvedPath, action: 'created' };
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'EEXIST') {
      return { path: resolvedPath, action: 'exists' };
    }
    return { path: resolvedPath, action: 'error' };
  }
}