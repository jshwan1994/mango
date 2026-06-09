'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/matches'
  const errorParam = params.get('error')
  const errorDetail = params.get('detail')
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'kakao' | null>(
    null
  )
  const [error, setError] = useState<string | null>(
    errorParam ? `${errorParam}${errorDetail ? `: ${errorDetail}` : ''}` : null
  )

  // 카카오: Supabase signInWithOAuth 우회. 직접 카카오 OAuth URL로 리다이렉트.
  //   - 일반 앱은 account_email 권한 없음 → signInWithOAuth가 자동 추가하면 KOE205
  //   - 우리 callback (/auth/kakao/callback)에서 토큰 교환 + signInWithIdToken
  function signInWithKakao() {
    setLoadingProvider('kakao')
    setError(null)
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    if (!clientId) {
      setError('카카오 설정이 누락되었습니다 (NEXT_PUBLIC_KAKAO_CLIENT_ID)')
      setLoadingProvider(null)
      return
    }
    const redirectUri = `${window.location.origin}/auth/kakao/callback`
    const scope = 'openid profile_nickname profile_image'
    const state = next
    const url =
      `https://kauth.kakao.com/oauth/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}`
    window.location.href = url
  }

  // 구글: 표준 Supabase OAuth (이메일 권한 문제 없음)
  async function signInWithGoogle() {
    setLoadingProvider('google')
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : '구글 로그인에 실패했습니다')
      setLoadingProvider(null)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🥭</span>
          <span className="font-black text-2xl text-[var(--brand-dark)]">망고</span>
        </Link>

        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm">
          <h1 className="text-xl font-black text-[var(--brand-dark)] text-center">
            망설이지 말고, 시작해요
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] text-center mt-2">
            소셜 계정으로 1초 만에 가입
          </p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={signInWithKakao}
              disabled={loadingProvider !== null}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-[#FEE500] text-[#3C1E1E] font-bold text-base hover:brightness-95 transition disabled:opacity-50"
            >
              <KakaoIcon />
              {loadingProvider === 'kakao' ? '카카오 연결 중...' : '카카오로 시작하기'}
            </button>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loadingProvider !== null}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-[var(--border)] text-[var(--brand-dark)] font-bold text-base hover:border-[var(--brand-dark)] transition disabled:opacity-50"
            >
              <GoogleIcon />
              {loadingProvider === 'google' ? '연결 중...' : 'Google로 시작하기'}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg p-3 text-center break-all">
              {error}
            </p>
          )}

          <p className="text-xs text-[var(--muted-foreground)] text-center mt-6 leading-relaxed">
            가입하면 망고의{' '}
            <Link href="/terms" className="underline">이용약관</Link> 및{' '}
            <Link href="/privacy" className="underline">개인정보처리방침</Link>에<br />
            동의하는 것으로 간주됩니다
          </p>
        </div>

        <Link
          href="/"
          className="block mt-6 text-center text-sm text-[var(--muted-foreground)] hover:text-[var(--brand-dark)]"
        >
          ← 홈으로
        </Link>
      </div>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🥭</span>
          <span className="font-black text-2xl text-[var(--brand-dark)]">망고</span>
        </div>
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm">
          <div className="h-6 w-40 mx-auto bg-[var(--muted)] rounded animate-pulse" />
          <div className="h-14 mt-8 bg-[var(--muted)] rounded-2xl animate-pulse" />
          <div className="h-14 mt-3 bg-[var(--muted)] rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3 0 0 0 .3.2.4.2.1.4 0 .4 0 .5-.1 3-2 3.5-2.4.6.1 1.3.1 2 .1 5.5 0 10-3.5 10-7.8S17.5 3 12 3z" />
    </svg>
  )
}
