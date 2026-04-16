import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n'
import { SessionCard } from '@/components/sessions/SessionCard'
import { EmptyState } from '@/components/sessions/EmptyState'
import type { SessionSummary, SessionStatus } from '@/types/database'

type FilterParam = SessionStatus | 'all'

type Props = {
  searchParams: Promise<{ status?: string }>
}

async function getSessions(): Promise<SessionSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sessions')
    .select('*, samples(count), session_evaluators(count)')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => ({
    ...row,
    sample_count: row.samples[0]?.count ?? 0,
    evaluator_count: row.session_evaluators[0]?.count ?? 0,
  }))
}

const VALID_FILTERS: FilterParam[] = ['all', 'draft', 'active', 'completed']

export default async function HomePage({ searchParams }: Props) {
  const { status: rawStatus } = await searchParams
  const activeFilter: FilterParam =
    VALID_FILTERS.includes(rawStatus as FilterParam)
      ? (rawStatus as FilterParam)
      : 'all'

  const [sessions, locale] = await Promise.all([getSessions(), getLocale()])
  const t = await getDictionary(locale)

  const filtered =
    activeFilter === 'all'
      ? sessions
      : sessions.filter((s) => s.status === activeFilter)

  const FILTERS: { key: FilterParam; label: string }[] = [
    { key: 'all', label: t['session.filter.all'] },
    { key: 'draft', label: t['session.filter.draft'] },
    { key: 'active', label: t['session.filter.active'] },
    { key: 'completed', label: t['session.filter.completed'] },
  ]

  return (
    <div className="flex flex-col flex-1">
      {/* Title row */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-widest text-[#506a6e]">
          {t['session.list.title']}
        </span>
        <Link
          href="/sessoes/nova"
          className="bg-[#f68721] text-white text-[12px] font-bold rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity"
        >
          {t['session.create.button']}
        </Link>
      </div>

      {/* Filter tabs — inspired by CVA "Before / After Assessment" tabs */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map(({ key, label }) => (
          <Link
            key={key}
            href={key === 'all' ? '/' : `/?status=${key}`}
            className={`shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-colors ${
              activeFilter === key
                ? 'bg-[#015484] text-white'
                : 'bg-white border border-[#e8e5e2] text-[#506a6e] hover:border-[#015484] hover:text-[#015484]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState t={t} showCta={activeFilter === 'all'} />
      ) : (
        <ul className="flex flex-col gap-2.5 px-4 pb-6">
          {filtered.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
