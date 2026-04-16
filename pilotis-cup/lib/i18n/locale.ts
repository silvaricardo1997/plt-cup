import 'server-only'
import { cookies } from 'next/headers'
import { hasLocale, type Locale } from './index'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get('locale')?.value ?? ''
  return hasLocale(value) ? value : 'pt-BR'
}
