'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SessionStatus } from '@/types/database'

export async function addSample(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sessionId = formData.get('session_id') as string
  const code = (formData.get('code') as string)?.trim()
  const label = (formData.get('label') as string)?.trim() || null

  if (!code || !sessionId) return

  const { data: last } = await supabase
    .from('samples')
    .select('position')
    .eq('session_id', sessionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (last?.position ?? 0) + 1

  await supabase.from('samples').insert({ session_id: sessionId, code, label, position })

  revalidatePath(`/sessoes/${sessionId}`)
}

export async function removeSample(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sampleId = formData.get('sample_id') as string
  const sessionId = formData.get('session_id') as string

  if (!sampleId || !sessionId) return

  // Verify coordinator owns the session before deleting
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('created_by', user.id)
    .maybeSingle()

  if (!session) return

  await supabase.from('samples').delete().eq('id', sampleId)

  revalidatePath(`/sessoes/${sessionId}`)
}

export async function duplicateSample(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sampleId = formData.get('sample_id') as string
  const sessionId = formData.get('session_id') as string

  if (!sampleId || !sessionId) return

  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('created_by', user.id)
    .maybeSingle()

  if (!session) return

  const { data: original } = await supabase
    .from('samples')
    .select('*')
    .eq('id', sampleId)
    .maybeSingle()

  if (!original) return

  const { data: last } = await supabase
    .from('samples')
    .select('position')
    .eq('session_id', sessionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (last?.position ?? 0) + 1

  await supabase.from('samples').insert({
    session_id: sessionId,
    code: `${original.code}*`,
    label: original.label,
    position,
  })

  revalidatePath(`/sessoes/${sessionId}`)
}

export async function updateSessionStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sessionId = formData.get('session_id') as string
  const status = formData.get('status') as SessionStatus

  if (!sessionId || !status) return

  await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)
    .eq('created_by', user.id)

  revalidatePath(`/sessoes/${sessionId}`)
  revalidatePath('/')
}
