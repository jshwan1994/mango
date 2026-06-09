'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './match'

const skillGrades = ['beginner', 'd', 'c', 'b', 'a', 'jagang'] as const

const setupSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상')
    .max(20, '닉네임은 20자 이하')
    .regex(/^[가-힣a-zA-Z0-9_]+$/, '한글·영문·숫자·_만 사용 가능'),
  region_sido: z.string().min(1, '시·도를 선택하세요'),
  region_sigungu: z.string().min(1, '시·군·구를 입력하세요'),
  self_grade: z.enum(skillGrades),
  home_court_id: z.string().uuid().optional().nullable(),
  bio: z.string().max(200).optional().nullable(),
})

export async function setupProfile(raw: unknown): Promise<ActionResult> {
  const parsed = setupSchema.safeParse(raw)
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

  // 닉네임 중복 체크
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', input.nickname)
    .neq('id', auth.user.id)
    .maybeSingle()

  if (existing) {
    return {
      ok: false,
      error: '이미 사용 중인 닉네임입니다',
      fieldErrors: { nickname: ['이미 사용 중인 닉네임입니다'] },
    }
  }

  const avatarUrl =
    (auth.user.user_metadata?.avatar_url as string | undefined) ?? null

  const { error } = await supabase.from('profiles').upsert(
    {
      id: auth.user.id,
      nickname: input.nickname,
      region_sido: input.region_sido,
      region_sigungu: input.region_sigungu,
      self_grade: input.self_grade,
      home_court_id: input.home_court_id ?? null,
      bio: input.bio ?? null,
      avatar_url: avatarUrl,
    },
    { onConflict: 'id' }
  )

  if (error) return { ok: false, error: error.message }

  revalidatePath('/', 'layout')
  redirect('/matches')
}
