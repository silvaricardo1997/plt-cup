import Link from 'next/link'
import type { SessionStatus, SessionSummary } from '@/types/database'

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; border: string }> = {
  draft: {
    label: 'Rascunho',
    color: 'text-[#f68721]',
    bg: 'bg-[#fff3e0]',
    border: 'border-[#f68721]',
  },
  active: {
    label: 'Em andamento',
    color: 'text-[#015484]',
    bg: 'bg-[#e3f2fb]',
    border: 'border-[#0b8bcc]',
  },
  completed: {
    label: 'Concluída',
    color: 'text-[#434344]',
    bg: 'bg-[#e8e5e2]',
    border: 'border-[#434344]',
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function SessionCard({ session }: { session: SessionSummary }) {
  const status = STATUS_CONFIG[session.status]

  return (
    <Link
      href={`/sessoes/${session.id}`}
      className={`block bg-white rounded-xl px-4 py-3.5 border-l-4 ${status.border} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[13px] text-[#201b54] truncate">
            {session.name}
          </p>
          <p className="text-[11px] text-[#506a6e] mt-1">
            {session.sample_count} amostras · {session.evaluator_count} avaliadores
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${status.color} ${status.bg}`}>
          {status.label}
        </span>
      </div>
      <p className="text-[10px] text-[#aa9577] mt-2">
        {formatDate(session.date)}
      </p>
    </Link>
  )
}
