'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = (formData.get('name') as string)?.trim()
  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string)?.trim() || null
  const isDraft = formData.get('draft') === 'true'

  if (!name || !date) redirect('/sessoes/nova?error=required')

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      name,
      date,
      notes,
      status: isDraft ? 'draft' : 'active',
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !session) {
    console.error('[createSession] insert error:', error)
    redirect('/sessoes/nova?error=generic')
  }

  await supabase.from('session_evaluators').insert({
    session_id: session.id,
    user_id: user.id,
    role: 'coordinator',
  })

  revalidatePath('/')
  redirect('/')
}
