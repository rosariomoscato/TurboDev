export interface SessionMessage {
  role: string;
  content: string;
  agentName?: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: SessionMessage[];
  agentName: string;
  tokenCount: number;
  contextLength: number;
  totalCost: number;
}
