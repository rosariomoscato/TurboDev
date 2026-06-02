export interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'question';
  content: string;
}
