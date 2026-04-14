import Link from 'next/link'
import { createSession } from '../actions'
import { Button } from '@/components/ui/Button'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default async function NovaSessaoPage(props: PageProps<'/sessoes/nova'>) {
  const { error } = await props.searchParams

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-[#015484] px-5 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="text-[#0b8bcc] text-xl leading-none"
          aria-label="Voltar"
        >
          ←
        </Link>
        <span className="text-white font-bold text-[15px]">Nova Sessão</span>
      </div>

      <form action={createSession} className="flex flex-col gap-4 px-4 pt-5 pb-8">
        {error === 'required' && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            Nome e data são obrigatórios.
          </p>
        )}
        {error === 'generic' && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            Erro ao criar sessão. Tente novamente.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="name"
            className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
          >
            Nome da sessão
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="ex: Safra 2025 — Lote A"
            className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc] placeholder:text-[#aa9577]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="date"
            className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
          >
            Data
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={todayISO()}
            className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="notes"
            className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
          >
            Observações (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Notas gerais da sessão..."
            className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc] placeholder:text-[#aa9577] resize-none"
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button type="submit" fullWidth>
            Criar Sessão
          </Button>

          <button
            type="submit"
            name="draft"
            value="true"
            className="w-full py-2.5 text-sm text-[#506a6e] font-medium hover:text-[#201b54] transition-colors"
          >
            Salvar Rascunho
          </button>
        </div>
      </form>
    </div>
  )
}
