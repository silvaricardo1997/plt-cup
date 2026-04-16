import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { saveEvaluation } from './actions'
import { ScoreSlider } from '@/components/evaluation/ScoreSlider'
import { Button } from '@/components/ui/Button'
import type { Evaluation } from '@/types/database'

type Props = {
  params: Promise<{ id: string; sampleId: string }>
}

export default async function AvaliarSamplePage({ params }: Props) {
  const { id: sessionId, sampleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load all samples for progress tracking
  const { data: allSamples } = await supabase
    .from('samples')
    .select('id, code, label, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true })

  if (!allSamples || allSamples.length === 0) notFound()

  const currentIndex = allSamples.findIndex((s) => s.id === sampleId)
  if (currentIndex === -1) notFound()

  const currentSample = allSamples[currentIndex]
  const nextSample = allSamples[currentIndex + 1] ?? null

  // Load existing evaluation (draft or submitted) for pre-population
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('*')
    .eq('sample_id', sampleId)
    .eq('evaluator_id', user.id)
    .maybeSingle()

  const ev = evaluation as Evaluation | null
  const isSubmitted = ev?.status === 'submitted'

  const progressPercent = ((currentIndex + 1) / allSamples.length) * 100

  return (
    <div className="flex flex-col flex-1">
      {/* Sticky header */}
      <div className="bg-[#015484] px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href={`/sessoes/${sessionId}`}
            className="text-[#0b8bcc] text-xl leading-none shrink-0"
            aria-label="Voltar"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-[15px] truncate">
              {currentSample.code}
              {currentSample.label ? ` — ${currentSample.label}` : ''}
            </p>
            <p className="text-[#0b8bcc] text-[11px] mt-0.5">
              Amostra {currentIndex + 1} de {allSamples.length}
            </p>
          </div>
          {isSubmitted && (
            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full text-[#015484] bg-[#e3f2fb]">
              Enviada
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-[#01406a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#f68721] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isSubmitted ? (
        /* Read-only view for submitted evaluations */
        <div className="flex flex-col gap-4 px-4 pt-5 pb-8">
          <p className="text-[13px] text-[#506a6e] text-center bg-[#e3f2fb] rounded-xl px-4 py-3">
            Esta avaliação já foi enviada e não pode ser alterada.
          </p>
          <SubmittedScores evaluation={ev} />
          {nextSample ? (
            <Link
              href={`/sessoes/${sessionId}/avaliar/${nextSample.id}`}
              className="block bg-[#f68721] text-white text-center font-bold text-sm rounded-[10px] px-5 py-3 hover:opacity-90 transition-opacity mt-2"
            >
              Próxima Amostra →
            </Link>
          ) : (
            <Link
              href={`/sessoes/${sessionId}`}
              className="block bg-[#015484] text-white text-center font-bold text-sm rounded-[10px] px-5 py-3 hover:opacity-90 transition-opacity mt-2"
            >
              Voltar à Sessão
            </Link>
          )}
        </div>
      ) : (
        /* Evaluation form */
        <form action={saveEvaluation} className="flex flex-col gap-6 px-4 pt-5 pb-8">
          <input type="hidden" name="sample_id" value={sampleId} />
          <input type="hidden" name="session_id" value={sessionId} />
          {nextSample && (
            <input type="hidden" name="next_sample_id" value={nextSample.id} />
          )}

          {/* Score attributes */}
          <div className="bg-white rounded-xl px-4 py-5 border border-[#e8e5e2] flex flex-col gap-6">
            <ScoreSlider
              name="fragrance"
              label="Fragrância / Aroma"
              defaultValue={ev?.fragrance ?? 8}
            />
            <ScoreSlider
              name="flavor"
              label="Sabor"
              defaultValue={ev?.flavor ?? 8}
            />
            <ScoreSlider
              name="aftertaste"
              label="Retrogosto"
              defaultValue={ev?.aftertaste ?? 8}
            />
            <ScoreSlider
              name="acidity"
              label="Acidez"
              defaultValue={ev?.acidity ?? 8}
            />
            <ScoreSlider
              name="body"
              label="Corpo"
              defaultValue={ev?.body ?? 8}
            />
            <ScoreSlider
              name="balance"
              label="Equilíbrio"
              defaultValue={ev?.balance ?? 8}
            />
            <ScoreSlider
              name="overall"
              label="Impressão Geral"
              defaultValue={ev?.overall ?? 8}
            />
          </div>

          {/* Defects */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]">
              Defeitos
            </span>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label
                  htmlFor="taint"
                  className="text-[10px] uppercase tracking-widest text-[#506a6e]"
                >
                  Taint (×4)
                </label>
                <input
                  id="taint"
                  name="taint"
                  type="number"
                  min="0"
                  max="20"
                  defaultValue={ev?.taint ?? 0}
                  className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm text-center font-bold text-[#201b54] bg-white focus:outline-none focus:border-[#0b8bcc]"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label
                  htmlFor="defects"
                  className="text-[10px] uppercase tracking-widest text-[#506a6e]"
                >
                  Defeito (×2)
                </label>
                <input
                  id="defects"
                  name="defects"
                  type="number"
                  min="0"
                  max="20"
                  defaultValue={ev?.defects ?? 0}
                  className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm text-center font-bold text-[#201b54] bg-white focus:outline-none focus:border-[#0b8bcc]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Observações sobre esta amostra..."
              defaultValue={ev?.notes ?? ''}
              className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc] placeholder:text-[#aa9577] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Button type="submit" name="action" value="submit" fullWidth>
              {nextSample ? 'Próxima Amostra →' : 'Finalizar Avaliação'}
            </Button>
            <button
              type="submit"
              name="action"
              value="draft"
              className="w-full py-2.5 text-sm text-[#506a6e] font-medium hover:text-[#201b54] transition-colors"
            >
              Salvar Rascunho
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function SubmittedScores({ evaluation }: { evaluation: Evaluation }) {
  const attrs: { label: string; value: number | null }[] = [
    { label: 'Fragrância / Aroma', value: evaluation.fragrance },
    { label: 'Sabor', value: evaluation.flavor },
    { label: 'Retrogosto', value: evaluation.aftertaste },
    { label: 'Acidez', value: evaluation.acidity },
    { label: 'Corpo', value: evaluation.body },
    { label: 'Equilíbrio', value: evaluation.balance },
    { label: 'Impressão Geral', value: evaluation.overall },
  ]

  const attributeSum = attrs.reduce((sum, a) => sum + (a.value ?? 0), 0)
  const total = attributeSum - evaluation.defects * 2 - evaluation.taint * 4

  return (
    <div className="bg-white rounded-xl border border-[#e8e5e2] overflow-hidden">
      {attrs.map((attr, i) => (
        <div
          key={attr.label}
          className={`flex items-center justify-between px-4 py-3 ${
            i < attrs.length - 1 ? 'border-b border-[#e8e5e2]' : ''
          }`}
        >
          <span className="text-[12px] text-[#506a6e]">{attr.label}</span>
          <span className="text-[14px] font-black text-[#015484] tabular-nums">
            {(attr.value ?? 0).toFixed(2)}
          </span>
        </div>
      ))}
      {(evaluation.defects > 0 || evaluation.taint > 0) && (
        <div className="border-t border-[#e8e5e2] px-4 py-3 flex items-center justify-between">
          <span className="text-[12px] text-[#506a6e]">Defeitos</span>
          <span className="text-[14px] font-bold text-red-400 tabular-nums">
            −{evaluation.defects * 2 + evaluation.taint * 4}
          </span>
        </div>
      )}
      <div className="border-t-2 border-[#e8e5e2] px-4 py-3.5 flex items-center justify-between bg-[#fbf8ec]">
        <span className="text-[12px] font-bold uppercase tracking-widest text-[#506a6e]">
          Total
        </span>
        <span className="text-[22px] font-black text-[#015484] tabular-nums">
          {total.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
