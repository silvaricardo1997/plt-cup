export type SessionStatus = 'draft' | 'active' | 'completed'
export type EvaluationStatus = 'draft' | 'submitted'
export type EvaluatorRole = 'coordinator' | 'evaluator'

export interface Session {
  id: string
  name: string
  date: string
  notes: string | null
  status: SessionStatus
  created_by: string
  invite_token: string
  created_at: string
}

export interface Sample {
  id: string
  session_id: string
  code: string
  label: string | null
  position: number
  created_at: string
}

export interface SessionEvaluator {
  session_id: string
  user_id: string
  role: EvaluatorRole
  joined_at: string
}

export interface Evaluation {
  id: string
  sample_id: string
  evaluator_id: string
  fragrance: number | null
  flavor: number | null
  aftertaste: number | null
  acidity: number | null
  body: number | null
  balance: number | null
  overall: number | null
  defects: number
  taint: number
  notes: string | null
  status: EvaluationStatus
  created_at: string
  submitted_at: string | null
}

export interface SessionSummary extends Session {
  sample_count: number
  evaluator_count: number
}

export interface Database {
  public: {
    Tables: {
      sessions: { Row: Session; Insert: Omit<Session, 'id' | 'created_at' | 'invite_token'>; Update: Partial<Session> }
      samples: { Row: Sample; Insert: Omit<Sample, 'id' | 'created_at'>; Update: Partial<Sample> }
      session_evaluators: { Row: SessionEvaluator; Insert: SessionEvaluator; Update: Partial<SessionEvaluator> }
      evaluations: { Row: Evaluation; Insert: Omit<Evaluation, 'id' | 'created_at'>; Update: Partial<Evaluation> }
    }
  }
}
