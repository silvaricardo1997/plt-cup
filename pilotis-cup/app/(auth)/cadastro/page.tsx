import Link from 'next/link'
import { signUp } from '../actions'
import { Button } from '@/components/ui/Button'

export default async function CadastroPage(props: PageProps<'/cadastro'>) {
  const { error } = await props.searchParams

  return (
    <form action={signUp} className="flex flex-col gap-4">
      {error === 'auth' && (
        <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
          Erro ao criar conta. Tente novamente.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
        />
      </div>

      <Button type="submit" fullWidth>
        Criar conta
      </Button>

      <p className="text-center text-sm text-[#506a6e]">
        Já tem conta?{' '}
        <Link href="/login" className="font-bold text-[#015484] hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
