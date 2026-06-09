import Link from 'next/link'
import { MapPin, Clock, Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { formatGrade, formatMatchType } from '@/lib/utils'
import type { Match, Court } from '@/types/database'

type MatchWithCourt = Match & { courts: Pick<Court, 'name' | 'region_sigungu'> | null }

async function fetchOpenMatches(): Promise<MatchWithCourt[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('matches')
      .select('*, courts(name, region_sigungu)')
      .eq('status', 'open')
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

export default async function MatchesPage() {
  const matches = await fetchOpenMatches()

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />

      <div className="max-w-5xl w-full mx-auto px-5 pt-6 flex items-center justify-between">
        <h1 className="text-xl font-black text-[var(--brand-dark)]">모집 중인 매치</h1>
        <Link
          href="/matches/new"
          className="flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition"
        >
          <Plus className="w-4 h-4" /> 매치 모집
        </Link>
      </div>

      <main className="max-w-5xl w-full mx-auto px-5 py-6 flex-1">
        {matches.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-5">
      <div className="text-6xl mb-4">🥭</div>
      <h2 className="text-xl font-black text-[var(--brand-dark)]">
        아직 모집 중인 매치가 없어요
      </h2>
      <p className="mt-2 text-[var(--muted-foreground)]">
        가장 먼저 매치를 모집하고 동료를 만나보세요
      </p>
      <Link
        href="/matches/new"
        className="inline-flex mt-6 px-6 py-3 text-sm font-bold rounded-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition"
      >
        <Plus className="w-4 h-4 mr-1" /> 첫 매치 모집하기
      </Link>

      <div className="mt-12 p-5 bg-white rounded-2xl border border-[var(--border)] text-left max-w-md mx-auto">
        <p className="text-xs font-bold text-[var(--brand-primary)]">🚧 베타 안내</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
          현재 송도 · 인천 지역에서 베타 테스트 중입니다. Supabase 연결 전이면 빈 화면이 정상입니다. <code className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">.env.local</code> 설정 후 데이터가 표시됩니다.
        </p>
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: MatchWithCourt }) {
  const scheduled = new Date(match.scheduled_at)
  const dateStr = scheduled.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = scheduled.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const location =
    match.courts?.name ??
    match.custom_location ??
    '장소 미정'
  const region = match.courts?.region_sigungu

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block p-5 bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--brand-primary)] hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-[var(--brand-bg-warm)] text-[var(--brand-primary)] font-bold">
              {formatMatchType(match.match_type)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-bold">
              {formatGrade(match.grade_min)}~{formatGrade(match.grade_max)}
            </span>
          </div>
          <h3 className="mt-2 font-bold text-[var(--brand-dark)] truncate">
            {match.title}
          </h3>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-[var(--muted-foreground)]">{dateStr}</p>
          <p className="text-lg font-black text-[var(--brand-dark)]">{timeStr}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {location}{region ? ` · ${region}` : ''}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {match.duration_minutes}분
        </span>
        <span className="flex items-center gap-1 ml-auto font-bold text-[var(--brand-dark)]">
          <Users className="w-3.5 h-3.5" />
          {match.current_participants}/{match.max_participants}
        </span>
      </div>
    </Link>
  )
}
