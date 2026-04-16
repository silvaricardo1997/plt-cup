-- SECURITY DEFINER function: allows any authenticated user to join a session
-- via invite token, bypassing RLS on sessions (which requires membership to read).
CREATE OR REPLACE FUNCTION join_session_by_token(p_token text)
RETURNS TABLE(session_id uuid, session_name text, session_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session sessions%ROWTYPE;
BEGIN
  -- Find session by invite token
  SELECT * INTO v_session
  FROM sessions
  WHERE invite_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  -- Add user as evaluator; no-op if already a member
  INSERT INTO session_evaluators (session_id, user_id, role)
  VALUES (v_session.id, auth.uid(), 'evaluator')
  ON CONFLICT (session_id, user_id) DO NOTHING;

  RETURN QUERY
    SELECT v_session.id, v_session.name, v_session.status;
END;
$$;
