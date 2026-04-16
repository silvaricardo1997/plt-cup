'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveEvaluation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sampleId = formData.get('sample_id') as string
  const sessionId = formData.get('session_id') as string
  const nextSampleId = formData.get('next_sample_id') as string | null
  const action = formData.get('action') as 'submit' | 'draft'

  const isSubmitting = action === 'submit'

  const payload = {
    sample_id: sampleId,
    evaluator_id: user.id,
    fragrance: Number(formData.get('fragrance')),
    flavor: Number(formData.get('flavor')),
    aftertaste: Number(formData.get('aftertaste')),
    acidity: Number(formData.get('acidity')),
    body: Number(formData.get('body')),
    balance: Number(formData.get('balance')),
    overall: Number(formData.get('overall')),
    defects: Number(formData.get('defects') ?? 0),
    taint: Number(formData.get('taint') ?? 0),
    notes: (formData.get('notes') as string)?.trim() || null,
    status: isSubmitting ? ('submitted' as const) : ('draft' as const),
    submitted_at: isSubmitting ? new Date().toISOString() : null,
  }

  await supabase
    .from('evaluations')
    .upsert(payload, { onConflict: 'sample_id,evaluator_id' })

  revalidatePath(`/sessoes/${sessionId}`)

  if (isSubmitting && nextSampleId) {
    redirect(`/sessoes/${sessionId}/avaliar/${nextSampleId}`)
  } else if (isSubmitting) {
    redirect(`/sessoes/${sessionId}`)
  } else {
    redirect(`/sessoes/${sessionId}/avaliar/${sampleId}`)
  }
}
