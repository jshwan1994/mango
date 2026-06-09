import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'

type Variant = 'home' | 'app'

export async function SiteHeader({ variant = 'app' }: { variant?: Variant }) {
  let user: { id: string; email?: string | null } | null = null
  let profile: { nickname: string; avatar_url: string | null } | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      user = { id: data.user.id, email: data.user.email }
      const { data: p } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.user.id)
        .maybeSingle()
      profile = p
    }
  } catch {
    // .env.local 없을 때 silent
  }

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-xl">🥭</span>
          <span className="font-black text-lg text-[var(--brand-dark)]">망고</span>
        </Link>

        <nav className="flex items-center gap-1">
          {variant === 'app' && (
            <Link
              href="/matches"
              className="px-3 py-2 text-sm font-medium text-[var(--brand-dark)] hover:text-[var(--brand-primary)]"
            >
              매치
            </Link>
          )}

          {user ? (
            <>
              <Link
                href="/my"
                className="px-3 py-2 text-sm font-medium text-[var(--brand-dark)] hover:text-[var(--brand-primary)]"
              >
                내 매치
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-[var(--brand-bg-warm)]"
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.nickname}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold flex items-center justify-center">
                    {(profile?.nickname ?? '?')[0]}
                  </span>
                )}
                <span className="text-sm font-medium text-[var(--brand-dark)] hidden sm:inline">
                  {profile?.nickname ?? '프로필 설정'}
                </span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--brand-dark)]"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold rounded-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
