// types/chat.ts

export type AssistantContent = {
  answer: string;
  suggestions?: string[];
};

export type MessageContent = string | AssistantContent;

export interface Message {
  id: string;
  chat_session_id: string;
  role: "user" | "assistant";
  content: MessageContent;   // 🔑 union type
  created_at: string;
  context_used?: [];
  user_feedback?: number | null;
  feedback_text?: string | null;
}
