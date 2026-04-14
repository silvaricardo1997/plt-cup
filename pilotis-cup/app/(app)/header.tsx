import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'EU'

  return (
    <header className="bg-[#015484] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <span className="font-black text-base tracking-widest">PILOTIS</span>
        <span className="block font-[family-name:var(--font-caveat)] text-[#f68721] text-xs leading-none mt-0.5">
          cafés especiais
        </span>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="w-9 h-9 rounded-full bg-[#0b8bcc] flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
          title="Sair"
        >
          {initials}
        </button>
      </form>
    </header>
  )
}
