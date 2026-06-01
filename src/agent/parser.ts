export interface ToolInvocation {
  name: string;
  args: Record<string, any>;
}

export function extractToolInvocations(text: string): ToolInvocation[] {
  const invocations: ToolInvocation[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('tool:')) {
      continue;
    }

    try {
      const after = trimmed.slice(5).trim();
      const parenIndex = after.indexOf('(');
      if (parenIndex === -1) continue;

      const name = after.slice(0, parenIndex).trim();
      const rest = after.slice(parenIndex + 1);

      if (!rest.endsWith(')')) continue;

      const jsonStr = rest.slice(0, -1).trim();
      const args = JSON.parse(jsonStr);

      invocations.push({ name, args });
    } catch (error) {
      continue;
    }
  }

  return invocations;
}

export function formatToolResult(result: any): string {
  return `tool_result(${JSON.stringify(result)})`;
}