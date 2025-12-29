-- chat_sessions
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  message_count int default 0,
  is_closed boolean default false,
  created_at timestamptz default now()
);

-- chat_messages
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_session_id uuid not null references chat_sessions(id),
  query text not null,
  response text,
  created_at timestamptz default now(),
  context_used jsonb,
  user_feedback smallint,
  feedback_text text
);



-- Enable RLS on both tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CHAT_SESSIONS POLICIES
-- =============================================

-- Policy: Users can view only their own chat sessions
CREATE POLICY "Users can view own chat sessions"
ON chat_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create their own chat sessions
CREATE POLICY "Users can create own chat sessions"
ON chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update only their own chat sessions
CREATE POLICY "Users can update own chat sessions"
ON chat_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete only their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
ON chat_sessions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- CHAT_MESSAGES POLICIES
-- =============================================

-- Policy: Users can view messages from their own chat sessions
CREATE POLICY "Users can view own chat messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  chat_session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
);

-- Policy: Users can create messages in their own chat sessions
CREATE POLICY "Users can create own chat messages"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  chat_session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update messages in their own chat sessions
CREATE POLICY "Users can update own chat messages"
ON chat_messages
FOR UPDATE
TO authenticated
USING (
  chat_session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  chat_session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete messages from their own chat sessions
CREATE POLICY "Users can delete own chat messages"
ON chat_messages
FOR DELETE
TO authenticated
USING (
  chat_session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
);