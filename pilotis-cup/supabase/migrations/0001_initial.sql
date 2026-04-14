-- Sessions
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  date          date NOT NULL,
  notes         text,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'completed')),
  created_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token  text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Samples (amostras dentro de uma sessão)
CREATE TABLE samples (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  code        text NOT NULL,
  label       text,
  position    int NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Session evaluators (quem participa)
CREATE TABLE session_evaluators (
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('coordinator', 'evaluator')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

-- Evaluations (avaliação SCA por avaliador por amostra)
CREATE TABLE evaluations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id     uuid NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  evaluator_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance     numeric(4,2),
  flavor        numeric(4,2),
  aftertaste    numeric(4,2),
  acidity       numeric(4,2),
  body          numeric(4,2),
  balance       numeric(4,2),
  overall       numeric(4,2),
  defects       int NOT NULL DEFAULT 0,
  taint         int NOT NULL DEFAULT 0,
  notes         text,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'submitted')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  submitted_at  timestamptz,
  UNIQUE (sample_id, evaluator_id)
);

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_evaluators ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policies: sessions
CREATE POLICY "users see their own sessions"
  ON sessions FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT session_id FROM session_evaluators WHERE user_id = auth.uid())
  );

CREATE POLICY "authenticated users create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "coordinator updates session"
  ON sessions FOR UPDATE
  USING (created_by = auth.uid());

-- Policies: samples
CREATE POLICY "evaluators see samples"
  ON samples FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE
        created_by = auth.uid() OR
        id IN (SELECT session_id FROM session_evaluators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "coordinator manages samples"
  ON samples FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
  );

-- Policies: session_evaluators
CREATE POLICY "users see evaluators of their sessions"
  ON session_evaluators FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE
        created_by = auth.uid() OR
        id IN (SELECT session_id FROM session_evaluators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "coordinator adds evaluators"
  ON session_evaluators FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
  );

-- Policies: evaluations
CREATE POLICY "evaluators see their evaluations"
  ON evaluations FOR SELECT
  USING (evaluator_id = auth.uid());

CREATE POLICY "evaluators manage their evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (evaluator_id = auth.uid());

CREATE POLICY "coordinator sees all evaluations in their sessions"
  ON evaluations FOR SELECT
  USING (
    sample_id IN (
      SELECT s.id FROM samples s
      JOIN sessions sess ON sess.id = s.session_id
      WHERE sess.created_by = auth.uid()
    )
  );

CREATE POLICY "evaluators update their drafts"
  ON evaluations FOR UPDATE
  USING (evaluator_id = auth.uid() AND status = 'draft');
