import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buildSampleResult, ATTRS } from '@/lib/results'
import { PrintButton } from '@/components/pdf/PrintButton'
import { ShareButton } from '@/components/pdf/ShareButton'
import type { Evaluation } from '@/types/database'

type Props = {
  params: Promise<{ id: string }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function ExportarPage({ params }: Props) {
  const { id: sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, date, notes, status')
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

  const totalEvaluators = results[0]?.evaluatorCount ?? 0
  const resultsUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/sessoes/${sessionId}/resultados`

  return (
    <div className="flex flex-col flex-1 bg-[#f0ede9]">

      {/* Action bar — hidden on print */}
      <div className="print:hidden bg-white border-b border-[#e8e5e2] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href={`/sessoes/${sessionId}/resultados`}
          className="text-[#0b8bcc] text-xl leading-none shrink-0"
          aria-label="Voltar"
        >
          ←
        </Link>
        <span className="text-[13px] font-bold text-[#201b54] flex-1 truncate">
          Preview PDF
        </span>
        <div className="flex gap-2 shrink-0">
          <ShareButton
            title={`Resultados — ${session.name}`}
            url={`/sessoes/${sessionId}/resultados`}
          />
          <PrintButton />
        </div>
      </div>

      {/* Paper */}
      <div className="px-4 py-6 print:p-0">
        <div
          className="bg-white mx-auto shadow-md print:shadow-none"
          style={{ maxWidth: '680px' }}
        >

          {/* Document header */}
          <div className="bg-[#015484] px-8 py-6 print:px-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white font-black text-xl tracking-widest">PILOTIS</p>
                <p className="text-[#f68721] text-sm mt-0.5">cafés especiais</p>
              </div>
              <div className="text-right">
                <p className="text-[#0b8bcc] text-[11px] uppercase tracking-widest">Sessão de Cupping SCA</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 print:px-10 flex flex-col gap-6">

            {/* Session info */}
            <div className="flex flex-col gap-1 pb-4 border-b border-[#e8e5e2]">
              <h1 className="text-[18px] font-black text-[#201b54]">{session.name}</h1>
              <div className="flex gap-4 text-[12px] text-[#506a6e] mt-1">
                <span>Data: {formatDate(session.date)}</span>
                {totalEvaluators > 0 && (
                  <span>Avaliadores: {totalEvaluators}</span>
                )}
                <span>Amostras: {results.length}</span>
              </div>
              {session.notes && (
                <p className="text-[12px] text-[#506a6e] mt-1 italic">{session.notes}</p>
              )}
            </div>

            {/* Ranking summary */}
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#506a6e] mb-3">
                Ranking
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e5e2]">
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#aa9577] pb-2 w-8">#</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#aa9577] pb-2">Amostra</th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#aa9577] pb-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id} className="border-b border-[#f0ede9]">
                      <td className="py-2 text-[#aa9577] text-[12px]">{i + 1}</td>
                      <td className="py-2">
                        <span className="font-black text-[13px] text-[#015484]">{r.code}</span>
                        {r.label && (
                          <span className="text-[12px] text-[#506a6e] ml-1.5">{r.label}</span>
                        )}
                      </td>
                      <td className="py-2 text-right font-black text-[15px] text-[#015484] tabular-nums">
                        {r.totalScore.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Per-sample details */}
            <div className="flex flex-col gap-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#506a6e]">
                Detalhes por Amostra
              </h2>

              {results.map((r, i) => {
                const attrValues = [
                  r.avgFragrance, r.avgFlavor, r.avgAftertaste,
                  r.avgAcidity, r.avgBody, r.avgBalance, r.avgOverall,
                ]

                return (
                  <div
                    key={r.id}
                    className="border border-[#e8e5e2] rounded-lg overflow-hidden print:break-inside-avoid"
                  >
                    {/* Sample header */}
                    <div className="bg-[#f5f3f0] px-5 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-black text-[14px] text-[#015484]">{r.code}</span>
                        {r.label && (
                          <span className="text-[12px] text-[#506a6e] ml-2">{r.label}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#aa9577]">
                          {r.evaluatorCount} {r.evaluatorCount === 1 ? 'avaliador' : 'avaliadores'}
                        </span>
                        <span className="text-[10px] text-[#aa9577] bg-white border border-[#e8e5e2] rounded px-1.5 py-0.5">
                          #{i + 1}
                        </span>
                      </div>
                    </div>

                    {/* Attribute rows */}
                    <div className="divide-y divide-[#f0ede9]">
                      {ATTRS.map((attr, j) => (
                        <div key={attr.key} className="px-5 py-2 flex items-center gap-4">
                          <span className="text-[12px] text-[#506a6e] w-36 shrink-0">
                            {attr.full}
                          </span>
                          <div className="flex-1 h-1.5 bg-[#f0ede9] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#015484] rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, ((attrValues[j] - 6) / 4) * 100)).toFixed(1)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[13px] font-black text-[#015484] w-10 text-right tabular-nums">
                            {attrValues[j].toFixed(2)}
                          </span>
                        </div>
                      ))}

                      {(r.avgDefects > 0 || r.avgTaint > 0) && (
                        <div className="px-5 py-2 flex items-center justify-between bg-[#fff8f8]">
                          <span className="text-[12px] text-[#aa9577]">
                            Defeitos (taint ×{r.avgTaint.toFixed(1)} + defeito ×{r.avgDefects.toFixed(1)})
                          </span>
                          <span className="text-[13px] font-bold text-red-400 tabular-nums">
                            −{(r.avgDefects * 2 + r.avgTaint * 4).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="bg-[#015484] px-5 py-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#0b8bcc]">
                        Total
                      </span>
                      <span className="text-[20px] font-black text-white tabular-nums">
                        {r.totalScore.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#e8e5e2] flex items-center justify-between">
              <span className="text-[10px] text-[#aa9577]">
                Gerado por Pilotis Cup · pilotis.com.br
              </span>
              <span className="text-[10px] text-[#aa9577]">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
