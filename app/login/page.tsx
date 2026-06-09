'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/matches'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWithKakao() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다')
      setLoading(false)
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
            카카오 계정으로 1초 만에 가입
          </p>

          <button
            type="button"
            onClick={signInWithKakao}
            disabled={loading}
            className="w-full mt-8 h-14 flex items-center justify-center gap-3 rounded-2xl bg-[#FEE500] text-[#3C1E1E] font-bold text-base hover:brightness-95 transition disabled:opacity-50"
          >
            <KakaoIcon />
            {loading ? '연결 중...' : '카카오로 시작하기'}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg p-3 text-center">
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

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3 0 0 0 .3.2.4.2.1.4 0 .4 0 .5-.1 3-2 3.5-2.4.6.1 1.3.1 2 .1 5.5 0 10-3.5 10-7.8S17.5 3 12 3z" />
    </svg>
  )
}
