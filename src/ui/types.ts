export interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'question' | 'permission_ask';
  content: string;
  agentName?: string;
}
