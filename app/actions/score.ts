'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './match'

const scoreSchema = z.object({
  match_id: z.string().uuid(),
  set_number: z.coerce.number().min(1).max(5),
  team_a_label: z.string().max(20).optional().nullable(),
  team_b_label: z.string().max(20).optional().nullable(),
  team_a_score: z.coerce.number().min(0).max(99),
  team_b_score: z.coerce.number().min(0).max(99),
  winner_team: z.enum(['a', 'b']).optional().nullable(),
  notes: z.string().max(200).optional().nullable(),
})

export async function saveScore(raw: unknown): Promise<ActionResult> {
  const parsed = scoreSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: '점수 입력값을 확인해주세요' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: '로그인이 필요합니다' }

  const input = parsed.data
  const winner =
    input.winner_team ??
    (input.team_a_score > input.team_b_score
      ? 'a'
      : input.team_b_score > input.team_a_score
        ? 'b'
        : null)

  // 같은 매치+세트는 update, 없으면 insert (upsert by unique 조합)
  const { data: existing } = await supabase
    .from('match_scores')
    .select('id')
    .eq('match_id', input.match_id)
    .eq('set_number', input.set_number)
    .eq('recorded_by', auth.user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('match_scores')
      .update({
        team_a_label: input.team_a_label ?? null,
        team_b_label: input.team_b_label ?? null,
        team_a_score: input.team_a_score,
        team_b_score: input.team_b_score,
        winner_team: winner,
        notes: input.notes ?? null,
      })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('match_scores').insert({
      match_id: input.match_id,
      recorded_by: auth.user.id,
      set_number: input.set_number,
      team_a_label: input.team_a_label ?? null,
      team_b_label: input.team_b_label ?? null,
      team_a_score: input.team_a_score,
      team_b_score: input.team_b_score,
      winner_team: winner,
      notes: input.notes ?? null,
    })
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/matches/${input.match_id}/score`)
  revalidatePath(`/matches/${input.match_id}`)
  return { ok: true }
}
