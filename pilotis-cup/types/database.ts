export type SessionStatus = 'draft' | 'active' | 'completed'
export type EvaluationStatus = 'draft' | 'submitted'
export type EvaluatorRole = 'coordinator' | 'evaluator'

export type Session = {
  id: string
  name: string
  date: string
  notes: string | null
  status: SessionStatus
  created_by: string
  invite_token: string
  created_at: string
}

export type Sample = {
  id: string
  session_id: string
  code: string
  label: string | null
  position: number
  created_at: string
}

export type SessionEvaluator = {
  session_id: string
  user_id: string
  role: EvaluatorRole
  joined_at: string
}

export type Evaluation = {
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

// View type: session with counts (used in the list)
export type SessionSummary = Session & {
  sample_count: number
  evaluator_count: number
}

// Insert types — columns with DB defaults are optional
type SessionInsert = {
  name: string
  date: string
  notes?: string | null
  status?: SessionStatus
  created_by: string
  invite_token?: string
}

type SampleInsert = {
  session_id: string
  code: string
  label?: string | null
  position: number
}

type SessionEvaluatorInsert = {
  session_id: string
  user_id: string
  role: EvaluatorRole
  joined_at?: string
}

type EvaluationInsert = {
  sample_id: string
  evaluator_id: string
  fragrance?: number | null
  flavor?: number | null
  aftertaste?: number | null
  acidity?: number | null
  body?: number | null
  balance?: number | null
  overall?: number | null
  defects?: number
  taint?: number
  notes?: string | null
  status?: EvaluationStatus
  submitted_at?: string | null
}

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: Session
        Insert: SessionInsert
        Update: Partial<Session>
        Relationships: []
      }
      samples: {
        Row: Sample
        Insert: SampleInsert
        Update: Partial<Sample>
        Relationships: []
      }
      session_evaluators: {
        Row: SessionEvaluator
        Insert: SessionEvaluatorInsert
        Update: Partial<SessionEvaluator>
        Relationships: []
      }
      evaluations: {
        Row: Evaluation
        Insert: EvaluationInsert
        Update: Partial<Evaluation>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_session_by_token: {
        Args: { p_token: string }
        Returns: { session_id: string; session_name: string; session_status: string }[]
      }
    }
    Enums: {
      session_status: SessionStatus
      evaluation_status: EvaluationStatus
      evaluator_role: EvaluatorRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
