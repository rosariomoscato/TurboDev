import chalk from 'chalk';

export function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.push(chalk.dim(codeBlockLines.join('\n')));
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      result.push(chalk.bold.cyan(line.slice(4)));
      continue;
    }
    if (line.startsWith('## ')) {
      result.push(chalk.bold.cyan(line.slice(3)));
      continue;
    }
    if (line.startsWith('# ')) {
      result.push(chalk.bold.cyan(line.slice(2)));
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      result.push(chalk.gray('  • ') + renderInline(line.slice(2)));
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.)\s(.*)$/);
      if (match) {
        result.push(chalk.gray('  ' + match[1] + ' ') + renderInline(match[2]));
        continue;
      }
    }

    result.push(renderInline(line));
  }

  return result.join('\n');
}

function renderInline(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        result += chalk.cyan(text.slice(i + 1, end));
        i = end + 1;
        continue;
      }
    }

    if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        result += chalk.bold(text.slice(i + 2, end));
        i = end + 2;
        continue;
      }
    }

    if (text[i] === '*' && (i + 1 < text.length && text[i + 1] !== '*')) {
      const end = text.indexOf('*', i + 1);
      if (end !== -1 && (end + 1 >= text.length || text[end + 1] !== '*')) {
        result += chalk.italic(text.slice(i + 1, end));
        i = end + 1;
        continue;
      }
    }

    result += text[i];
    i++;
  }

  return result;
}
