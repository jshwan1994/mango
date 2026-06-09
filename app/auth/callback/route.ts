// Supabase OAuth Callback Handler
// 카카오 로그인 후 토큰 교환 → 프로필 유무에 따라 분기

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/matches'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error: sessionError, data } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // 프로필 존재 여부 확인 → 없으면 /profile/setup
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile) {
    const setupUrl = new URL('/profile/setup', origin)
    if (next !== '/matches') setupUrl.searchParams.set('next', next)
    return NextResponse.redirect(setupUrl)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
