-- Allow coordinator to delete samples from their sessions
CREATE POLICY "coordinator deletes samples"
  ON samples FOR DELETE
  USING (
    session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
  );

-- Allow coordinator to update samples in their sessions
CREATE POLICY "coordinator updates samples"
  ON samples FOR UPDATE
  USING (
    session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
  );
