import { Box, Text } from 'ink';

interface Props {
  model?: string;
  status?: string;
}

export default function StatusBar({ model, status }: Props) {
  return (
    <Box borderStyle="single" paddingX={1} width={100}>
      <Text color="gray">TurboDev</Text>
      <Text color="gray"> | </Text>
      <Text color="cyan">{model || 'No model'}</Text>
      {status && (
        <>
          <Text color="gray"> | </Text>
          <Text color="yellow">{status}</Text>
        </>
      )}
    </Box>
  );
}