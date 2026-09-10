export type BotStatus = 'Connected' | 'Waiting' | 'Disconnected';

export interface ChatMessage {
  id: string;
  sender: 'User' | 'Bot';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'archived';
  avatar?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  status: 'active' | 'error' | 'disconnected';
  apiKey: string;
  lastValidated?: string;
}

export interface BotCommand {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  event: string;
  provider: string;
  status: 'success' | 'error' | 'warning';
  detail: string;
}
