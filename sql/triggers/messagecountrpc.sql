-- Create function to safely increment message count
CREATE OR REPLACE FUNCTION increment_message_count(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE chat_sessions
  SET message_count = message_count + 1
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_message_count(UUID) TO authenticated, anon;
