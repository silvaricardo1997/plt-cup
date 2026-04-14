import { describe, it, expect } from 'vitest'
import { calculateTotalScore } from './score'

describe('calculateTotalScore', () => {
  it('retorna null quando nenhum atributo foi preenchido', () => {
    expect(calculateTotalScore({
      fragrance: null, flavor: null, aftertaste: null,
      acidity: null, body: null, balance: null, overall: null,
      defects: 0, taint: 0,
    })).toBeNull()
  })

  it('soma os atributos preenchidos e subtrai defeitos', () => {
    expect(calculateTotalScore({
      fragrance: 8.0, flavor: 8.0, aftertaste: 7.5,
      acidity: 8.0, body: 7.5, balance: 8.0, overall: 8.0,
      defects: 0, taint: 0,
    })).toBe(55.0)
  })

  it('subtrai defeitos * 2 e taint * 4', () => {
    expect(calculateTotalScore({
      fragrance: 8.0, flavor: 8.0, aftertaste: 8.0,
      acidity: 8.0, body: 8.0, balance: 8.0, overall: 8.0,
      defects: 1, taint: 1,
    })).toBe(56.0 - 2 - 4)
  })
})
