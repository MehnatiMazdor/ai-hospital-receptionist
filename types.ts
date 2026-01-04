export type ChatRole = "user" | "assistant";

export interface RAGContextChunk {
  id: string;
  page: number | null;
  score: number;
}


export interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  isClosed: boolean;
  createdAt: string;
}


export interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;

  /** RAG context used by assistant (always array, default []) */
  contextUsed: RAGContextChunk[];

  /** Optional feedback (usually assistant only) */
  userFeedback?: -1 | 0 | 1;
  feedbackText?: string;
}


export interface UIChatMessage extends ChatMessage {
  /** True while assistant is generating */
  isTyping?: boolean;

  /** True for optimistic messages not yet confirmed */
  optimistic?: boolean;

  /** Used for streaming updates */
  streamId?: string;
}


export interface SendMessageRequest {
  chatSessionId?: string; // undefined = new chat
  content: string;
}


export interface SendMessageResponse {
  chatSession: ChatSession;
  userMessage: ChatMessage;
  assistantMessage?: ChatMessage; // undefined if generation failed
}
