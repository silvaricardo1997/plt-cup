import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buildSampleResult, ATTRS, scoreBarWidth } from '@/lib/results'
import type { Evaluation } from '@/types/database'

type Props = {
  params: Promise<{ id: string }>
}

const RANK_STYLE: Record<number, { badge: string; border: string }> = {
  1: { badge: 'bg-[#f68721] text-white',  border: 'border-[#f68721]' },
  2: { badge: 'bg-[#506a6e] text-white',  border: 'border-[#506a6e]' },
  3: { badge: 'bg-[#aa9577] text-white',  border: 'border-[#aa9577]' },
}

function rankStyle(rank: number) {
  return RANK_STYLE[rank] ?? { badge: 'bg-[#e8e5e2] text-[#506a6e]', border: 'border-[#e8e5e2]' }
}

export default async function ResultadosPage({ params }: Props) {
  const { id: sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, status')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) notFound()

  const { data: samplesData } = await supabase
    .from('samples')
    .select('id, code, label, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true })

  const samples = samplesData ?? []
  const sampleIds = samples.map((s) => s.id)

  const { data: evaluationsData } = sampleIds.length
    ? await supabase
        .from('evaluations')
        .select('*')
        .in('sample_id', sampleIds)
        .eq('status', 'submitted')
    : { data: [] }

  const evaluations = (evaluationsData ?? []) as Evaluation[]

  const bySample = new Map<string, Evaluation[]>()
  for (const s of samples) bySample.set(s.id, [])
  for (const ev of evaluations) bySample.get(ev.sample_id)?.push(ev)

  const results = samples
    .map((s) => buildSampleResult(s, bySample.get(s.id) ?? []))
    .filter((r) => r.evaluatorCount > 0)
    .sort((a, b) => b.totalScore - a.totalScore)

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-[#015484] px-5 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/sessoes/${sessionId}`}
            className="text-[#0b8bcc] text-xl leading-none shrink-0"
            aria-label="Voltar"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[15px]">Resultados</p>
            <p className="text-[#0b8bcc] text-[11px] mt-0.5 truncate">{session.name}</p>
          </div>
          {results.length > 0 && (
            <Link
              href={`/sessoes/${sessionId}/resultados/exportar`}
              className="shrink-0 text-[11px] font-bold text-white bg-[#0b8bcc] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Exportar
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-5 pb-8">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-[15px] font-bold text-[#201b54]">Sem avaliações ainda</p>
            <p className="text-[13px] text-[#506a6e] max-w-[240px]">
              Os resultados aparecerão aqui assim que os avaliadores enviarem suas notas.
            </p>
            <Link href={`/sessoes/${sessionId}`} className="text-[13px] font-bold text-[#0b8bcc] mt-2">
              ← Voltar à sessão
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-[#aa9577] text-center">
              {results.length} {results.length === 1 ? 'amostra avaliada' : 'amostras avaliadas'}
            </p>

            {results.map((result, i) => {
              const rank = i + 1
              const rs = rankStyle(rank)
              const attrValues = [
                result.avgFragrance, result.avgFlavor, result.avgAftertaste,
                result.avgAcidity, result.avgBody, result.avgBalance, result.avgOverall,
              ]

              return (
                <div key={result.id} className={`bg-white rounded-xl border-l-4 ${rs.border} shadow-sm overflow-hidden`}>
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${rs.badge}`}>
                      {rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[15px] text-[#201b54] leading-tight">
                        {result.code}
                        {result.label && (
                          <span className="font-normal text-[13px] text-[#506a6e] ml-1.5">{result.label}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#aa9577] mt-0.5">
                        {result.evaluatorCount} {result.evaluatorCount === 1 ? 'avaliador' : 'avaliadores'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[24px] font-black text-[#015484] leading-none tabular-nums">
                        {result.totalScore.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-[#aa9577] mt-0.5">pts</p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex flex-col gap-1.5">
                    {ATTRS.map((attr, j) => {
                      const score = attrValues[j]
                      return (
                        <div key={attr.key} className="flex items-center gap-2">
                          <span className="text-[10px] text-[#aa9577] w-7 shrink-0">{attr.short}</span>
                          <div className="flex-1 h-1.5 bg-[#f0ede9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#015484] rounded-full" style={{ width: scoreBarWidth(score) }} />
                          </div>
                          <span className="text-[11px] font-bold text-[#201b54] w-9 text-right shrink-0 tabular-nums">
                            {score.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}

                    {(result.avgDefects > 0 || result.avgTaint > 0) && (
                      <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-[#e8e5e2]">
                        <span className="text-[10px] text-[#aa9577] w-7 shrink-0">Def</span>
                        <span className="flex-1 text-[11px] text-[#aa9577]">
                          taint ×{result.avgTaint.toFixed(1)} · defeito ×{result.avgDefects.toFixed(1)}
                        </span>
                        <span className="text-[11px] font-bold text-red-400 w-9 text-right shrink-0 tabular-nums">
                          −{(result.avgDefects * 2 + result.avgTaint * 4).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
