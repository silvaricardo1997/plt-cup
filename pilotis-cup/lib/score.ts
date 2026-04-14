interface ScoreInput {
  fragrance: number | null
  flavor: number | null
  aftertaste: number | null
  acidity: number | null
  body: number | null
  balance: number | null
  overall: number | null
  defects: number
  taint: number
}

export function calculateTotalScore(input: ScoreInput): number | null {
  const attributes = [
    input.fragrance,
    input.flavor,
    input.aftertaste,
    input.acidity,
    input.body,
    input.balance,
    input.overall,
  ]

  const filled = attributes.filter((v): v is number => v !== null)
  if (filled.length === 0) return null

  const sum = filled.reduce((acc, v) => acc + v, 0)
  return sum - input.defects * 2 - input.taint * 4
}
