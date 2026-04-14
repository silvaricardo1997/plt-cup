import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SessionCard } from '@/components/sessions/SessionCard'
import { EmptyState } from '@/components/sessions/EmptyState'
import type { SessionSummary } from '@/types/database'

async function getSessions(): Promise<SessionSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      samples(count),
      session_evaluators(count)
    `)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => ({
    ...row,
    sample_count: row.samples[0]?.count ?? 0,
    evaluator_count: row.session_evaluators[0]?.count ?? 0,
  }))
}

export default async function HomePage() {
  const sessions = await getSessions()

  return (
    <div className="flex flex-col flex-1">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-widest text-[#506a6e]">
          Suas sessões
        </span>
        <Link
          href="/sessoes/nova"
          className="bg-[#f68721] text-white text-[12px] font-bold rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity"
        >
          + Nova Sessão
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2.5 px-4 pb-6">
          {sessions.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
