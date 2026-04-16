import Link from 'next/link'
import { signIn } from '../actions'
import { Button } from '@/components/ui/Button'

export default async function LoginPage(props: PageProps<'/login'>) {
  const { error, next } = await props.searchParams

  return (
    <form action={signIn} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      {error === 'auth' && (
        <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
          E-mail ou senha incorretos
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
          autoComplete="current-password"
          className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
        />
      </div>

      <Button type="submit" fullWidth>
        Entrar
      </Button>

      <p className="text-center text-sm text-[#506a6e]">
        Não tem conta?{' '}
        <Link href="/cadastro" className="font-bold text-[#015484] hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
