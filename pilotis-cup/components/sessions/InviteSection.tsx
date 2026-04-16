'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface InviteSectionProps {
  inviteToken: string
}

export function InviteSection({ inviteToken }: InviteSectionProps) {
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/convite/${inviteToken}`)
  }, [inviteToken])

  async function handleCopy() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  async function handleShare() {
    if (!inviteUrl) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Convite — Pilotis Cup',
          text: 'Você foi convidado para uma sessão de cupping.',
          url: inviteUrl,
        })
        return
      } catch {
        // cancelled or unsupported
      }
    }
    handleCopy()
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]">
        Convidar Avaliadores
      </span>

      <div className="bg-white rounded-xl border border-[#e8e5e2] px-4 py-5 flex flex-col items-center gap-4">
        {inviteUrl ? (
          <div className="p-3 bg-white rounded-lg border border-[#e8e5e2]">
            <QRCodeSVG
              value={inviteUrl}
              size={160}
              fgColor="#015484"
              bgColor="#ffffff"
              level="M"
            />
          </div>
        ) : (
          <div className="w-[160px] h-[160px] bg-[#f0ede9] rounded-lg animate-pulse" />
        )}

        <p className="text-[11px] text-[#aa9577] text-center max-w-[220px] leading-relaxed">
          Compartilhe o QR code ou o link abaixo para convidar avaliadores.
        </p>

        {inviteUrl && (
          <p className="text-[10px] text-[#506a6e] bg-[#f5f3f0] rounded-lg px-3 py-2 text-center break-all font-mono">
            {inviteUrl}
          </p>
        )}

        <div className="flex gap-2 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 text-[12px] font-bold text-[#015484] border border-[#e8e5e2] rounded-lg hover:bg-[#f5f3f0] transition-colors"
          >
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 text-[12px] font-bold text-white bg-[#015484] rounded-lg hover:opacity-90 transition-opacity"
          >
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  )
}
