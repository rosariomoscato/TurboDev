import { Box, Text } from 'ink';

interface Props {
  model?: string;
  status?: string;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, Math.max(0, max - 3))}...` : text;
}

export default function StatusBar({ model, status }: Props) {
  const columns = process.stdout.columns || 100;
  const width = Math.max(40, columns - 2);
  const base = 'TurboDev | ';
  const suffix = status ? ` | ${status}` : '';
  const modelText = truncate(model || 'No model', Math.max(10, width - base.length - suffix.length - 4));

  return (
    <Box borderStyle="single" paddingX={1} width={width}>
      <Text color="gray">TurboDev</Text>
      <Text color="gray"> | </Text>
      <Text color="cyan">{modelText}</Text>
      {status && (
        <>
          <Text color="gray"> | </Text>
          <Text color="yellow">{status}</Text>
        </>
      )}
    </Box>
  );
}