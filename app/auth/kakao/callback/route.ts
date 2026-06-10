// 망고 — 카카오 OIDC 콜백 핸들러
//
// 흐름:
//   1) 사용자가 /login에서 [카카오 로그인] 클릭
//   2) 카카오 OAuth URL로 리다이렉트 (scope=openid+profile_nickname+profile_image)
//   3) 사용자 동의 → 카카오가 이 callback으로 인가 코드 전달
//   4) 우리가 카카오 토큰 API에 코드 교환 → ID Token 받기
//   5) supabase.auth.signInWithIdToken({ provider: 'kakao', token: idToken }) 호출
//   6) 세션 생성 → 프로필 유무에 따라 분기
//
// 핵심: Supabase signInWithOAuth는 account_email scope를 강제로 추가하므로
//       (일반 앱에서 KOE205 에러) 카카오 OIDC를 직접 호출하는 우회 방식

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const next = searchParams.get('state') ?? '/matches'

  if (errorParam) {
    console.error('[kakao callback] error:', errorParam)
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
  const clientSecret = process.env.KAKAO_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('[kakao callback] 환경변수 누락')
    return NextResponse.redirect(`${origin}/login?error=kakao_config_missing`)
  }

  // redirect_uri는 인가 코드 요청 때와 정확히 동일해야 함 (카카오 검증)
  // Vercel preview URL 대신 NEXT_PUBLIC_SITE_URL 사용
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  const redirectUri = `${siteUrl}/auth/kakao/callback`

  try {
    // 1) 카카오 토큰 교환 (code → id_token + access_token)
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    })

    const tokenData = (await tokenRes.json()) as {
      id_token?: string
      access_token?: string
      error?: string
      error_description?: string
    }

    if (!tokenRes.ok || tokenData.error || !tokenData.id_token) {
      console.error('[kakao callback] token exchange failed:', tokenData)
      return NextResponse.redirect(
        `${origin}/login?error=kakao_token_failed&detail=${encodeURIComponent(
          tokenData.error_description ?? tokenData.error ?? 'no_id_token'
        )}`
      )
    }

    // 2) Supabase signInWithIdToken (카카오 OIDC 공식 지원)
    const supabase = await createClient()
    const { data, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'kakao',
      token: tokenData.id_token,
      access_token: tokenData.access_token,
    })

    if (signInError || !data.user) {
      console.error('[kakao callback] signInWithIdToken failed:', signInError)
      return NextResponse.redirect(
        `${origin}/login?error=supabase_signin_failed&detail=${encodeURIComponent(
          signInError?.message ?? 'unknown'
        )}`
      )
    }

    // 3) 프로필 존재 여부 → 신규는 setup, 기존은 next(/matches)
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
  } catch (e) {
    console.error('[kakao callback] unexpected:', e)
    return NextResponse.redirect(`${origin}/login?error=kakao_unexpected`)
  }
}
