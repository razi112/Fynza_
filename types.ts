export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface User {
  email: string;
  name: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  STREAMING = 'STREAMING',
}

export type Personality = 'professional' | 'friendly' | 'creative' | 'humorous' | 'strict';

export interface AppSettings {
  // AI Model
  model: string;
  temperature: number;
  maxOutputTokens: number;
  enableThinking: boolean;
  thinkingBudget: number;
  
  // Personality
  personality: Personality;
  customSystemInstruction: string;
  
  // Privacy & Data
  incognito: boolean;
  
  // UI
  fontSize: 'small' | 'medium' | 'large';
  showCodeLineNumbers: boolean;
  codeBlockTheme: 'light' | 'dark';
}

export const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxOutputTokens: 2048,
  enableThinking: false,
  thinkingBudget: 1024,
  personality: 'friendly',
  customSystemInstruction: '',
  incognito: false,
  fontSize: 'medium',
  showCodeLineNumbers: true,
  codeBlockTheme: 'dark',
};