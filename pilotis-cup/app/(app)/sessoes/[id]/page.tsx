import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { addSample, removeSample, duplicateSample, updateSessionStatus } from './actions'
import { Button } from '@/components/ui/Button'
import { InviteSection } from '@/components/sessions/InviteSection'
import type { Session, Sample, SessionEvaluator, SessionStatus } from '@/types/database'

type Props = {
  params: Promise<{ id: string }>
}

type SessionDetail = {
  session: Session
  samples: Sample[]
  evaluators: SessionEvaluator[]
  isCoordinator: boolean
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-[#f68721]', bg: 'bg-[#fff3e0]' },
  active: { label: 'Em andamento', color: 'text-[#0b8bcc]', bg: 'bg-[#e3f2fb]' },
  completed: { label: 'Concluída', color: 'text-[#434344]', bg: 'bg-[#e8e5e2]' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Suggests next blind code: A, B, C... Z, AA, AB...
function nextSampleCode(count: number): string {
  if (count < 26) return String.fromCharCode(65 + count)
  const first = String.fromCharCode(65 + Math.floor(count / 26) - 1)
  const second = String.fromCharCode(65 + (count % 26))
  return first + second
}

async function getSessionDetail(id: string, userId: string): Promise<SessionDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('*, samples(*), session_evaluators(*)')
    .eq('id', id)
    .single()

  if (error || !data) return null

  const row = data as any
  const samples: Sample[] = [...(row.samples ?? [])].sort(
    (a: Sample, b: Sample) => a.position - b.position,
  )
  const evaluators: SessionEvaluator[] = row.session_evaluators ?? []

  return {
    session: {
      id: row.id,
      name: row.name,
      date: row.date,
      notes: row.notes,
      status: row.status,
      created_by: row.created_by,
      invite_token: row.invite_token,
      created_at: row.created_at,
    },
    samples,
    evaluators,
    isCoordinator: row.created_by === userId,
  }
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const detail = await getSessionDetail(id, user.id)
  if (!detail) notFound()

  const { session, samples, evaluators, isCoordinator } = detail
  const status = STATUS_CONFIG[session.status]

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="bg-[#015484] px-5 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="text-[#0b8bcc] text-xl leading-none shrink-0"
          aria-label="Voltar"
        >
          ←
        </Link>
        <p className="flex-1 min-w-0 text-white font-bold text-[15px] truncate">
          {session.name}
        </p>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${status.color} ${status.bg}`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-5 pb-8">

        {/* Session info */}
        <div className="bg-white rounded-xl px-4 py-3.5 border border-[#e8e5e2]">
          <p className="text-[12px] text-[#506a6e]">
            {formatDate(session.date)}
            {' · '}
            {samples.length} {samples.length === 1 ? 'amostra' : 'amostras'}
            {' · '}
            {evaluators.length} {evaluators.length === 1 ? 'avaliador' : 'avaliadores'}
          </p>
          {session.notes && (
            <p className="text-[13px] text-[#201b54] mt-2 leading-relaxed">{session.notes}</p>
          )}
        </div>

        {/* Status actions (coordinator only) */}
        {isCoordinator && session.status === 'draft' && (
          <form action={updateSessionStatus}>
            <input type="hidden" name="session_id" value={session.id} />
            <input type="hidden" name="status" value="active" />
            <Button type="submit" variant="secondary" fullWidth>
              Iniciar Sessão
            </Button>
          </form>
        )}
        {isCoordinator && session.status === 'active' && (
          <form action={updateSessionStatus}>
            <input type="hidden" name="session_id" value={session.id} />
            <input type="hidden" name="status" value="completed" />
            <Button type="submit" variant="ghost" fullWidth>
              Finalizar Sessão
            </Button>
          </form>
        )}

        {/* Evaluate CTA (all participants, when active) */}
        {session.status === 'active' && (
          <Link
            href={`/sessoes/${session.id}/avaliar`}
            className="block bg-[#f68721] text-white text-center font-bold text-sm rounded-[10px] px-5 py-3 hover:opacity-90 transition-opacity"
          >
            Avaliar →
          </Link>
        )}

        {/* Results CTA (when active or completed and has samples) */}
        {(session.status === 'active' || session.status === 'completed') && samples.length > 0 && (
          <Link
            href={`/sessoes/${session.id}/resultados`}
            className="block bg-white border border-[#e8e5e2] text-[#015484] text-center font-bold text-sm rounded-[10px] px-5 py-3 hover:bg-[#f5f3f0] transition-colors"
          >
            Ver Resultados
          </Link>
        )}

        {/* Samples */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]">
            Amostras ({samples.length})
          </span>

          {samples.length === 0 ? (
            <p className="text-[13px] text-[#aa9577] text-center py-4 bg-white rounded-xl border border-[#e8e5e2]">
              Nenhuma amostra adicionada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {samples.map((sample) => (
                <li
                  key={sample.id}
                  className="bg-white rounded-xl px-4 py-3 border border-[#e8e5e2] flex items-center gap-3"
                >
                  <span className="font-black text-[15px] text-[#015484] w-8 shrink-0">
                    {sample.code}
                  </span>
                  <span className="flex-1 text-[13px] text-[#201b54] truncate">
                    {sample.label ?? (
                      <span className="text-[#aa9577]">Sem descrição</span>
                    )}
                  </span>
                  {isCoordinator && (
                    <div className="flex items-center gap-1 shrink-0">
                      <form action={duplicateSample}>
                        <input type="hidden" name="sample_id" value={sample.id} />
                        <input type="hidden" name="session_id" value={session.id} />
                        <button
                          type="submit"
                          className="text-[11px] font-bold text-[#0b8bcc] px-2 py-1 hover:opacity-70 transition-opacity"
                          title="Duplicar amostra"
                        >
                          duplicar
                        </button>
                      </form>
                      <form action={removeSample}>
                        <input type="hidden" name="sample_id" value={sample.id} />
                        <input type="hidden" name="session_id" value={session.id} />
                        <button
                          type="submit"
                          className="text-[13px] font-bold text-[#aa9577] px-2 py-1 hover:text-red-400 transition-colors"
                          title="Remover amostra"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isCoordinator && (
            <form action={addSample} className="flex gap-2 mt-1">
              <input type="hidden" name="session_id" value={session.id} />
              <input
                name="code"
                type="text"
                required
                maxLength={6}
                placeholder={nextSampleCode(samples.length)}
                className="w-16 border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc] placeholder:text-[#aa9577]"
              />
              <input
                name="label"
                type="text"
                placeholder="Nome ou descrição"
                className="flex-1 border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc] placeholder:text-[#aa9577]"
              />
              <Button type="submit" className="shrink-0 !px-4">
                +
              </Button>
            </form>
          )}
        </div>

        {/* Invite section (coordinator only, not completed) */}
        {isCoordinator && session.status !== 'completed' && (
          <InviteSection inviteToken={session.invite_token} />
        )}

        {/* Evaluators */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]">
            Avaliadores ({evaluators.length})
          </span>
          <ul className="flex flex-col gap-2">
            {evaluators.map((ev) => {
              const isMe = ev.user_id === user.id
              const initials = isMe ? 'EU' : ev.user_id.slice(0, 2).toUpperCase()
              return (
                <li
                  key={ev.user_id}
                  className="bg-white rounded-xl px-4 py-3 border border-[#e8e5e2] flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#e3f2fb] flex items-center justify-center text-[11px] font-bold text-[#015484] shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-[13px] text-[#201b54] font-semibold">
                      {isMe ? 'Você' : 'Avaliador'}
                    </p>
                    <p className="text-[11px] text-[#506a6e]">
                      {ev.role === 'coordinator' ? 'Coordenador' : 'Avaliador'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

      </div>
    </div>
  )
}
