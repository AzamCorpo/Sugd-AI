export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface UserMemory {
  name?: string;
  age?: string;
  city?: string;
  profession?: string;
  interests?: string[];
  goals?: string[];
  [key: string]: any;
}
