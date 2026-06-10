import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Settings,
  Wallet,
  Users,
  Receipt,
  Star,
  MessageSquare,
  Trophy,
  ChevronRight,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { signOut } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { formatGrade } from '@/lib/utils'
import type { Profile, Court } from '@/types/database'

export const metadata = { title: '내 정보 — 망고' }

type ProfileWithCourt = Profile & {
  home_court: Pick<Court, 'name' | 'region_sigungu'> | null
}

export default async function ProfilePage() {
  let profile: ProfileWithCourt | null = null
  let needsAuth = false
  let needsSetup = false

  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      needsAuth = true
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('*, home_court:courts(name, region_sigungu)')
        .eq('id', auth.user.id)
        .maybeSingle<ProfileWithCourt>()

      if (!data) {
        needsSetup = true
      } else {
        profile = data
      }
    }
  } catch {
    // .env.local 미설정 시 그냥 안내 화면
  }

  if (needsAuth) redirect('/login?next=/profile')
  if (needsSetup) redirect('/profile/setup')

  return (
    <div className="flex flex-col flex-1 pb-20">
      <SiteHeader />

      <main className="max-w-2xl w-full mx-auto px-5 py-6 flex-1 space-y-5">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-black text-[var(--brand-dark)]">내 정보</h1>
          <Link
            href="/profile/settings"
            aria-label="설정"
            className="p-2 rounded-full hover:bg-white"
          >
            <Settings className="w-5 h-5 text-[var(--brand-dark)]" />
          </Link>
        </div>

        {/* 프로필 카드 (스매시 패턴) */}
        {profile && (
          <section className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[var(--border)]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="w-16 h-16 rounded-full mango-gradient text-white font-black text-2xl flex items-center justify-center">
                {profile.nickname[0]}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-[var(--brand-dark)]">
                {profile.nickname}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {formatGrade(profile.self_grade)} · 매너 {profile.manner_score}
              </p>
              {profile.home_court && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  📍 {profile.home_court.name}
                </p>
              )}
            </div>
            <Link
              href="/profile/edit"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--brand-dark)] border border-[var(--border)] hover:border-[var(--brand-dark)] transition"
            >
              프로필 보기
            </Link>
          </section>
        )}

        {/* 망고 페이 (Phase 2 안내) */}
        <section className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[var(--border)]">
          <span className="w-10 h-10 rounded-full mango-gradient text-white font-black flex items-center justify-center">
            🥭
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--brand-dark)]">망고 페이</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {profile?.elo_rating ?? 1200} <span className="text-[var(--brand-primary)]">SP</span>
            </p>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">준비 중</span>
        </section>

        {/* 호스팅 그룹 */}
        <MenuGroup title="호스팅">
          <MenuItem
            href="/profile/guests"
            icon={<Users className="w-5 h-5" />}
            label="게스트 요청"
            comingSoon
          />
          <MenuItem
            href="/profile/settlements"
            icon={<Wallet className="w-5 h-5" />}
            label="정산"
            comingSoon
          />
          <MenuItem
            href="/my"
            icon={<MessageSquare className="w-5 h-5" />}
            label="내가 모집한 매치"
          />
        </MenuGroup>

        {/* 활동 그룹 */}
        <MenuGroup title="활동">
          <MenuItem
            href="/profile/payments"
            icon={<Receipt className="w-5 h-5" />}
            label="결제 내역"
            comingSoon
          />
          <MenuItem
            href="/profile/reviews"
            icon={<Star className="w-5 h-5" />}
            label="플레이어 리뷰"
            comingSoon
          />
          <MenuItem
            href="/profile/court-reviews"
            icon={<Trophy className="w-5 h-5" />}
            label="체육관 리뷰"
            comingSoon
          />
          <MenuItem
            href="/profile/favorites"
            icon={<Star className="w-5 h-5" />}
            label="즐겨찾는 체육관"
            comingSoon
          />
        </MenuGroup>

        {/* 로그아웃 */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full p-4 bg-white rounded-2xl border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-red-600 hover:border-red-200 transition"
          >
            로그아웃
          </button>
        </form>

        <p className="text-center text-xs text-[var(--muted-foreground)] pt-2">
          망고 Mango · 2026
        </p>
      </main>
    </div>
  )
}

function MenuGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="px-1 mb-2 text-sm font-bold text-[var(--muted-foreground)]">
        {title}
      </h2>
      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
        {children}
      </div>
    </section>
  )
}

function MenuItem({
  href,
  icon,
  label,
  comingSoon,
}: {
  href: string
  icon: React.ReactNode
  label: string
  comingSoon?: boolean
}) {
  if (comingSoon) {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 text-[var(--muted-foreground)]">
        <span className="text-[var(--brand-dark)]/40">{icon}</span>
        <span className="flex-1 text-sm">{label}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
          준비 중
        </span>
      </div>
    )
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--brand-bg-warm)]/40 transition"
    >
      <span className="text-[var(--brand-dark)]">{icon}</span>
      <span className="flex-1 text-sm text-[var(--brand-dark)] font-medium">
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
    </Link>
  )
}
