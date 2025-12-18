
export type Role = 'user' | 'analyst';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  imageData?: string;
  audioData?: string;
}

export interface ConversationState {
  messages: Message[];
  isAnalyzing: boolean;
  language: 'zh' | 'en';
}
