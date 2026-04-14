import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-6 py-16">
      <div className="w-14 h-14 rounded-full bg-[#e3f2fb] flex items-center justify-center mb-4">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0b8bcc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      </div>
      <p className="font-bold text-[14px] text-[#201b54] mb-2">
        Nenhuma sessão ainda
      </p>
      <p className="text-[12px] text-[#506a6e] leading-relaxed mb-6 max-w-xs">
        Crie sua primeira sessão de cupping para começar as avaliações.
      </p>
      <Link
        href="/sessoes/nova"
        className="rounded-[10px] px-5 py-3 text-sm font-bold bg-[#015484] text-white hover:opacity-90 transition-opacity"
      >
        Criar primeira sessão
      </Link>
    </div>
  )
}
