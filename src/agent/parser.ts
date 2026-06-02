export interface ToolInvocation {
  name: string;
  args: Record<string, any>;
}

export function extractToolInvocations(text: string): ToolInvocation[] {
  const invocations: ToolInvocation[] = [];
  const lines = text.split('\n');

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith('tool:')) {
      i++;
      continue;
    }

    const after = trimmed.slice(5).trim();
    const parenIndex = after.indexOf('(');
    if (parenIndex === -1) {
      i++;
      continue;
    }

    const name = after.slice(0, parenIndex).trim();
    let jsonText = after.slice(parenIndex + 1);

    if (jsonText.trim().endsWith(')')) {
      const jsonStr = jsonText.trim().slice(0, -1).trim();
      try {
        const args = JSON.parse(jsonStr);
        invocations.push({ name, args });
      } catch {}
      i++;
      continue;
    }

    let j = i + 1;
    while (j < lines.length) {
      jsonText += '\n' + lines[j];
      const t = jsonText.trim();
      if (t.endsWith(')')) {
        try {
          const args = JSON.parse(t.slice(0, -1).trim());
          invocations.push({ name, args });
        } catch {}
        j++;
        break;
      }
      j++;
    }

    i = j;
  }

  return invocations;
}

export function formatToolResult(result: any): string {
  return `tool_result(${JSON.stringify(result)})`;
}