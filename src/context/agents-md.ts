import fs from "fs";
import path from "path";

export function findAgentsMd(cwd: string): string | null {
  const filePath = path.join(cwd, "AGENTS.md");
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

export function loadAgentsMd(cwd: string): string | null {
  const filePath = findAgentsMd(cwd);
  if (!filePath) {
    return null;
  }
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function agentsMdExists(cwd: string): boolean {
  return findAgentsMd(cwd) !== null;
}

export function appendToAgentsMd(cwd: string, content: string): void {
  const filePath = findAgentsMd(cwd);
  if (!filePath) {
    throw new Error(`AGENTS.md not found in ${cwd}`);
  }
  fs.appendFileSync(filePath, `\n${content}`, "utf-8");
}

export function writeAgentsMd(cwd: string, content: string): void {
  const filePath = path.join(cwd, "AGENTS.md");
  fs.writeFileSync(filePath, content, "utf-8");
}
