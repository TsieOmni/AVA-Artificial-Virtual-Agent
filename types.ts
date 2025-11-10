export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface InteractiveElement {
  type: 'highlight' | 'point';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  image?: string; // base64 data URL for display (user upload)
  imageForApi?: ImageForApi; // Data formatted for the Gemini API
  fileName?: string; // name of the uploaded file
  visualization?: string; // base64 data URL for display (AI generated)
  interactiveElements?: InteractiveElement[]; // For blackboard mode
  timestamp: string;
}

export interface ImageForApi {
  mimeType: string;
  data: string; // base64 string without prefix
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export interface KnowledgebaseFile {
  name: string;
  content: string;
}

export interface KnowledgebaseSection {
  id: string;
  title: string;
  files: KnowledgebaseFile[];
}

export type AgentName = 'ava' | 'tutor' | 'academics' | 'work' | 'entrepreneur';
