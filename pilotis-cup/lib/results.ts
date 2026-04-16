import type { Evaluation } from '@/types/database'

export type SampleResult = {
  id: string
  code: string
  label: string | null
  avgFragrance: number
  avgFlavor: number
  avgAftertaste: number
  avgAcidity: number
  avgBody: number
  avgBalance: number
  avgOverall: number
  avgDefects: number
  avgTaint: number
  totalScore: number
  evaluatorCount: number
}

export type AttrDef = {
  key: keyof Pick<Evaluation, 'fragrance' | 'flavor' | 'aftertaste' | 'acidity' | 'body' | 'balance' | 'overall'>
  short: string
  full: string
}

export const ATTRS: AttrDef[] = [
  { key: 'fragrance',  short: 'Fra', full: 'Fragrância / Aroma' },
  { key: 'flavor',     short: 'Sab', full: 'Sabor' },
  { key: 'aftertaste', short: 'Ret', full: 'Retrogosto' },
  { key: 'acidity',    short: 'Aci', full: 'Acidez' },
  { key: 'body',       short: 'Cor', full: 'Corpo' },
  { key: 'balance',    short: 'Equ', full: 'Equilíbrio' },
  { key: 'overall',    short: 'Imp', full: 'Impressão Geral' },
]

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function buildSampleResult(
  sample: { id: string; code: string; label: string | null },
  evaluations: Evaluation[],
): SampleResult {
  if (evaluations.length === 0) {
    return {
      ...sample,
      avgFragrance: 0, avgFlavor: 0, avgAftertaste: 0,
      avgAcidity: 0, avgBody: 0, avgBalance: 0, avgOverall: 0,
      avgDefects: 0, avgTaint: 0,
      totalScore: 0, evaluatorCount: 0,
    }
  }

  const avgFragrance  = mean(evaluations.map((e) => Number(e.fragrance  ?? 0)))
  const avgFlavor     = mean(evaluations.map((e) => Number(e.flavor     ?? 0)))
  const avgAftertaste = mean(evaluations.map((e) => Number(e.aftertaste ?? 0)))
  const avgAcidity    = mean(evaluations.map((e) => Number(e.acidity    ?? 0)))
  const avgBody       = mean(evaluations.map((e) => Number(e.body       ?? 0)))
  const avgBalance    = mean(evaluations.map((e) => Number(e.balance    ?? 0)))
  const avgOverall    = mean(evaluations.map((e) => Number(e.overall    ?? 0)))
  const avgDefects    = mean(evaluations.map((e) => e.defects))
  const avgTaint      = mean(evaluations.map((e) => e.taint))

  const totalScore =
    avgFragrance + avgFlavor + avgAftertaste +
    avgAcidity + avgBody + avgBalance + avgOverall -
    avgDefects * 2 - avgTaint * 4

  return {
    ...sample,
    avgFragrance, avgFlavor, avgAftertaste,
    avgAcidity, avgBody, avgBalance, avgOverall,
    avgDefects, avgTaint,
    totalScore, evaluatorCount: evaluations.length,
  }
}

// Normalize score to bar width percentage: 6–10 → 0–100%
export function scoreBarWidth(score: number): string {
  return `${Math.max(0, Math.min(100, ((score - 6) / 4) * 100)).toFixed(1)}%`
}
