'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { hasLocale } from '@/lib/i18n'

export async function setLocale(locale: string) {
  if (!hasLocale(locale)) return

  const cookieStore = await cookies()
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  revalidatePath('/', 'layout')
}
