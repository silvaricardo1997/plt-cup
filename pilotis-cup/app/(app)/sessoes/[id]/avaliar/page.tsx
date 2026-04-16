import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AvaliarEntryPage({ params }: Props) {
  const { id: sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify the session is active and user has access
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || session.status !== 'active') {
    redirect(`/sessoes/${sessionId}`)
  }

  // Load all samples ordered by position
  const { data: samples } = await supabase
    .from('samples')
    .select('id')
    .eq('session_id', sessionId)
    .order('position', { ascending: true })

  if (!samples || samples.length === 0) {
    redirect(`/sessoes/${sessionId}`)
  }

  // Find samples already submitted by this user
  const sampleIds = samples.map((s) => s.id)
  const { data: submitted } = await supabase
    .from('evaluations')
    .select('sample_id')
    .in('sample_id', sampleIds)
    .eq('evaluator_id', user.id)
    .eq('status', 'submitted')

  const submittedIds = new Set(submitted?.map((e) => e.sample_id) ?? [])
  const next = samples.find((s) => !submittedIds.has(s.id))

  if (!next) {
    // All samples evaluated — back to session
    redirect(`/sessoes/${sessionId}`)
  }

  redirect(`/sessoes/${sessionId}/avaliar/${next.id}`)
}
