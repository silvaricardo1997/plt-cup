'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  url: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex-1 bg-white border border-[#e8e5e2] text-[#015484] text-sm font-bold rounded-[10px] px-5 py-3 hover:bg-[#f5f3f0] transition-colors"
    >
      {copied ? 'Link copiado!' : 'Compartilhar'}
    </button>
  )
}
