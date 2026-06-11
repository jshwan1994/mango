import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { BannerCarousel } from '@/components/banner-carousel'
import { MatchModeTabs } from '@/components/match-mode-tabs'
import { MatchFilters } from '@/components/match-filters'
import { formatGrade, formatMatchType } from '@/lib/utils'
import type { Match, Court, MatchMode, Banner } from '@/types/database'

type MatchWithCourt = Match & {
  courts: Pick<Court, 'name' | 'region_sigungu' | 'image_url'> | null
}

const VALID_MODES: MatchMode[] = ['social', 'skill', 'court']

async function fetchActiveBanners(): Promise<Banner[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(5)
    return (data ?? []) as Banner[]
  } catch {
    return []
  }
}

async function fetchOpenMatches(mode: MatchMode): Promise<MatchWithCourt[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('matches')
      .select('*, courts(name, region_sigungu, image_url)')
      .eq('status', 'open')
      .eq('match_mode', mode)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[matches] fetch failed:', error.message)
      return []
    }
    return (data ?? []) as unknown as MatchWithCourt[]
  } catch (e) {
    console.error('[matches] supabase not configured:', e)
    return []
  }
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const params = await searchParams
  const mode: MatchMode = VALID_MODES.includes(params.mode as MatchMode)
    ? (params.mode as MatchMode)
    : 'social'
  const [matches, banners] = await Promise.all([
    fetchOpenMatches(mode),
    fetchActiveBanners(),
  ])

  return (
    <div className="flex flex-col flex-1 pb-20">
      <SiteHeader />

      <BannerCarousel banners={banners} />

      <MatchModeTabs current={mode} />
      <MatchFilters />

      <main className="max-w-5xl w-full mx-auto px-5 py-5 flex-1">
        {matches.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          <ul className="space-y-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </ul>
        )}
      </main>

      {/* 플로팅 + 버튼 (스매시 패턴) */}
      <Link
        href="/matches/new"
        aria-label="매치 모집하기"
        className="fixed bottom-24 right-5 z-30 flex items-center justify-center w-14 h-14 rounded-full mango-gradient text-white shadow-xl shadow-[var(--brand-primary)]/40 hover:brightness-95 active:scale-95 transition"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </Link>
    </div>
  )
}

function EmptyState({ mode }: { mode: MatchMode }) {
  const labels: Record<MatchMode, { title: string; desc: string }> = {
    social: {
      title: '아직 친목 매칭이 없어요',
      desc: '가장 먼저 게임데이를 모집해 동료를 만나보세요',
    },
    skill: {
      title: '아직 급수 매칭이 없어요',
      desc: '같은 급수끼리 진검승부할 매치를 모집해보세요',
    },
    court: {
      title: '체육관 예약은 준비 중이에요',
      desc: '곧 체육관 직접 예약 기능이 열립니다',
    },
  }
  const { title, desc } = labels[mode]

  return (
    <div className="text-center py-16 px-5">
      <div className="text-6xl mb-4">🥭</div>
      <h2 className="text-xl font-black text-[var(--brand-dark)]">{title}</h2>
      <p className="mt-2 text-[var(--muted-foreground)]">{desc}</p>
      {mode !== 'court' && (
        <Link
          href="/matches/new"
          className="inline-flex mt-6 px-6 py-3 text-sm font-bold rounded-full mango-gradient text-white hover:brightness-95 transition"
        >
          <Plus className="w-4 h-4 mr-1" /> 첫 매치 모집하기
        </Link>
      )}
    </div>
  )
}

function MatchCard({ match }: { match: MatchWithCourt }) {
  const scheduled = new Date(match.scheduled_at)
  const dateStr = scheduled.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  })
  const startTime = scheduled.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const end = new Date(scheduled.getTime() + match.duration_minutes * 60_000)
  const endTime = end.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const location = match.courts?.name ?? match.custom_location ?? '장소 미정'
  const region = match.courts?.region_sigungu
  const imageUrl =
    match.courts?.image_url ??
    'https://placehold.co/600x400/FFF4E0/3D2817?text=Mango+Court'
  const isFull = match.current_participants >= match.max_participants

  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--brand-primary)] hover:shadow-md transition-all"
    >
      {/* 좌측 체육관 사진 — 스매시 패턴 */}
      <div className="relative w-28 sm:w-36 flex-shrink-0 bg-[var(--muted)]">
        <Image
          src={imageUrl}
          alt={location}
          fill
          sizes="(max-width: 640px) 112px, 144px"
          className="object-cover"
        />
      </div>

      {/* 우측 정보 */}
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {region && (
              <span className="inline-flex items-center text-xs text-[var(--muted-foreground)]">
                <MapPin className="w-3 h-3 mr-0.5" />
                {region}
              </span>
            )}
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold ${
              isFull
                ? 'text-[var(--muted-foreground)]'
                : 'text-[var(--brand-primary)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {match.current_participants}/{match.max_participants}명
          </span>
        </div>

        <h3 className="mt-1 font-bold text-[var(--brand-dark)] truncate">
          {location}
        </h3>

        <p className="mt-1 text-sm text-[var(--brand-dark)]">
          <span className="font-medium">{dateStr}</span>{' '}
          <span className="text-[var(--brand-primary)] font-bold">
            {startTime}~{endTime}
          </span>
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-xs flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-[var(--brand-bg-warm)] text-[var(--brand-primary)] font-bold">
            {formatMatchType(match.match_type)}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
            {formatGrade(match.grade_min)}~{formatGrade(match.grade_max)}
          </span>
          {match.cost_per_person > 0 && (
            <span className="text-[var(--muted-foreground)]">
              {match.cost_per_person.toLocaleString()}원
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
