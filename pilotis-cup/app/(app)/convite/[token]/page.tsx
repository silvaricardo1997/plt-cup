import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ token: string }>
}

export default async function ConvitePage({ params }: Props) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .rpc('join_session_by_token', { p_token: token })

  if (error || !data || (data as any[]).length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-6 text-center gap-4">
        <p className="text-[22px] font-black text-[#201b54]">Convite inválido</p>
        <p className="text-[13px] text-[#506a6e] max-w-[260px]">
          Este link de convite não é válido ou expirou. Peça ao coordenador um novo link.
        </p>
        <Link
          href="/"
          className="text-[13px] font-bold text-[#0b8bcc] mt-2"
        >
          ← Voltar ao início
        </Link>
      </div>
    )
  }

  const session = (data as { session_id: string; session_name: string; session_status: string }[])[0]

  redirect(`/sessoes/${session.session_id}`)
}
