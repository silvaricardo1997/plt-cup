'use client'

import { setLocale } from '@/app/actions'
import type { Locale } from '@/lib/i18n'

interface Props {
  locale: Locale
}

export function LanguageSwitcher({ locale }: Props) {
  const isPT = locale === 'pt-BR'

  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-[#0b4e7a]">
      <form action={setLocale.bind(null, 'pt-BR')}>
        <button
          type="submit"
          className={`px-2.5 py-1 text-[10px] font-black transition-colors ${
            isPT
              ? 'bg-[#0b8bcc] text-white'
              : 'bg-transparent text-[#0b8bcc] hover:text-white'
          }`}
        >
          PT
        </button>
      </form>
      <form action={setLocale.bind(null, 'en')}>
        <button
          type="submit"
          className={`px-2.5 py-1 text-[10px] font-black transition-colors ${
            !isPT
              ? 'bg-[#0b8bcc] text-white'
              : 'bg-transparent text-[#0b8bcc] hover:text-white'
          }`}
        >
          EN
        </button>
      </form>
    </div>
  )
}
