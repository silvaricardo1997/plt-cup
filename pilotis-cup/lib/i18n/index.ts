import 'server-only'
import type ptBR from './pt-BR.json'

const dictionaries = {
  'pt-BR': () => import('./pt-BR.json').then((m) => m.default),
  'en': () => import('./en.json').then((m) => m.default),
}

export type Locale = keyof typeof dictionaries
export type Dictionary = typeof ptBR

export const LOCALES: Locale[] = ['pt-BR', 'en']

export function hasLocale(locale: string): locale is Locale {
  return locale in dictionaries
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]() as Promise<Dictionary>
}
