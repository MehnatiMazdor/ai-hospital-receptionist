// lib/supabase/types.ts
export interface ChatSession {
  id: string;                  // uuid
  user_id: string;             // uuid of user
  title: string;               // session title
  message_count: number;       // number of messages in session
  is_closed: boolean;          // session closed or active
  created_at: string;          // timestamptz string
}

export interface ChatMessage {
  id: string;                  // uuid
  chat_session_id: string;     // reference to chat session
  query: string;               // patient query
  response?: string | null;    // chatbot response
  created_at: string;          // timestamptz string
  context_used?: [];          // JSONB of documents/context used
  user_feedback?: number;      // smallint
  feedback_text?: string;      // optional feedback
}

export interface AnonymousUser {
  id: string;                  // uuid from supabase auth.users table
  created_at: string;           // timestamptz
}



// export type Database = {
//   public: {
//     Tables: {
//       anonymous_users: {
//         Row: {
//           id: string;
//           created_at: string;
//         };
//         Insert: {
//           id?: string;
//           created_at?: string;
//         };
//         Update: {
//           id?: string;
//           created_at?: string;
//         };
//       }
//       chat_sessions: {
//         Row: {
//           id: string;
//           user_id: string;
//           title: string;
//           message_count: number;
//           is_closed: boolean;
//           created_at: string;
//         }
//         Insert: {
//           id: string;
//           user_id: string;
//           title: string;
//           message_count: number;
//           is_closed: boolean;
//           created_at: string;
//         }
//         Update: {
//           id?: string;
//           user_id?: string;
//           title?: string;
//           message_count?: number;
//           is_closed?: boolean;
//           created_at?: string;
//         }
//       }
//       chat_messages: {
//         Row: {
//           id: string;
//           chat_session_id: string;
//           query: string;
//           response?: string | null;
//           created_at: string;
//           context_used?: any;
//           user_feedback?: number;
//           feedback_text?: string;
//         }
//         Insert: {
//           id?: string;
//           chat_session_id: string;
//           query: string;
//           response?: string | null;
//           created_at?: string;
//           context_used?: any;
//           user_feedback?: number;
//           feedback_text?: string;
//         }
//         Update: {
//           id?: string;
//           chat_session_id?: string;
//           query?: string;
//           response?: string | null;
//           created_at?: string;
//           context_used?: any;
//           user_feedback?: number;
//           feedback_text?: string;
//         }
//       }
//     }
//   }
// }