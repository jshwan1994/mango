'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const skillGrades = ['beginner', 'd', 'c', 'b', 'a', 'jagang'] as const
const matchTypes = ['singles', 'doubles', 'mixed', 'game_day'] as const

const createMatchSchema = z
  .object({
    title: z.string().min(4, '제목은 4자 이상').max(50, '제목은 50자 이하'),
    description: z.string().max(500).optional().nullable(),
    match_type: z.enum(matchTypes),
    scheduled_at: z.string().min(1, '시작 시간을 선택하세요'),
    duration_minutes: z.coerce.number().min(30).max(240),
    court_id: z.string().uuid().optional().nullable(),
    custom_location: z.string().max(200).optional().nullable(),
    max_participants: z.coerce.number().min(2).max(12),
    grade_min: z.enum(skillGrades),
    grade_max: z.enum(skillGrades),
    cost_per_person: z.coerce.number().min(0).max(100000),
  })
  .refine(
    (d) =>
      skillGrades.indexOf(d.grade_min) <= skillGrades.indexOf(d.grade_max),
    { message: '최소 급수가 최대 급수보다 높을 수 없습니다', path: ['grade_max'] }
  )
  .refine((d) => !!d.court_id || !!d.custom_location, {
    message: '체육관을 선택하거나 장소를 직접 입력하세요',
    path: ['custom_location'],
  })
  .refine((d) => new Date(d.scheduled_at).getTime() > Date.now(), {
    message: '시작 시간은 현재보다 이후여야 합니다',
    path: ['scheduled_at'],
  })

export type CreateMatchInput = z.infer<typeof createMatchSchema>

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createMatch(
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = createMatchSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: '입력값을 확인해주세요',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: '로그인이 필요합니다' }

  const input = parsed.data
  const { data, error } = await supabase
    .from('matches')
    .insert({
      host_id: auth.user.id,
      title: input.title,
      description: input.description ?? null,
      match_type: input.match_type,
      scheduled_at: new Date(input.scheduled_at).toISOString(),
      duration_minutes: input.duration_minutes,
      court_id: input.court_id ?? null,
      custom_location: input.custom_location ?? null,
      max_participants: input.max_participants,
      grade_min: input.grade_min,
      grade_max: input.grade_max,
      cost_per_person: input.cost_per_person,
      current_participants: 1,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? '매치 생성 실패' }
  }

  // 호스트 자동 참가
  await supabase.from('match_participants').insert({
    match_id: data.id,
    user_id: auth.user.id,
    status: 'approved',
  })

  revalidatePath('/matches')
  redirect(`/matches/${data.id}`)
}

export async function applyToMatch(
  matchId: string,
  message?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: '로그인이 필요합니다' }

  const { error } = await supabase.from('match_participants').insert({
    match_id: matchId,
    user_id: auth.user.id,
    message: message ?? null,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: '이미 신청한 매치입니다' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/matches/${matchId}`)
  return { ok: true }
}

export async function decideParticipant(
  participantId: string,
  decision: 'approved' | 'rejected'
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: '로그인이 필요합니다' }

  // 호스트인지 검증
  const { data: part } = await supabase
    .from('match_participants')
    .select('match_id, matches!inner(host_id, current_participants, max_participants)')
    .eq('id', participantId)
    .single<{
      match_id: string
      matches: { host_id: string; current_participants: number; max_participants: number }
    }>()

  if (!part || part.matches.host_id !== auth.user.id) {
    return { ok: false, error: '호스트만 결정할 수 있습니다' }
  }

  if (
    decision === 'approved' &&
    part.matches.current_participants >= part.matches.max_participants
  ) {
    return { ok: false, error: '정원이 가득 찼습니다' }
  }

  const { error } = await supabase
    .from('match_participants')
    .update({ status: decision })
    .eq('id', participantId)

  if (error) return { ok: false, error: error.message }

  if (decision === 'approved') {
    await supabase
      .from('matches')
      .update({ current_participants: part.matches.current_participants + 1 })
      .eq('id', part.match_id)
  }

  revalidatePath(`/matches/${part.match_id}`)
  return { ok: true }
}
