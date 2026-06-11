import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Plus, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import type { Tournament } from '@/types/database'

export const metadata = { title: '대회 — 망고' }

async function fetchTournaments(): Promise<Tournament[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['upcoming', 'open'])
      .order('starts_on', { ascending: true })
      .limit(50)
    return (data ?? []) as Tournament[]
  } catch {
    return []
  }
}

export default async function TournamentsPage() {
  const tournaments = await fetchTournaments()

  return (
    <div className="flex flex-col flex-1 pb-24">
      <SiteHeader />

      <div className="max-w-5xl w-full mx-auto px-5 pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[var(--brand-dark)]">대회</h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            전국 배드민턴 대회 정보 · 모집중 우선
          </p>
        </div>
        <Link
          href="/tournaments/new"
          className="flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-full bg-white border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-bg-warm)] transition"
        >
          <Plus className="w-4 h-4" /> 대회 제보
        </Link>
      </div>

      <main className="max-w-5xl w-full mx-auto px-5 py-5 flex-1">
        {tournaments.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--brand-bg-warm)] flex items-center justify-center mb-4">
        <Trophy className="w-8 h-8 text-[var(--brand-primary)]" />
      </div>
      <p className="font-bold text-[var(--brand-dark)]">아직 등록된 대회가 없어요</p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        주변 대회를 제일 먼저 제보해주세요
      </p>
      <Link
        href="/tournaments/new"
        className="inline-flex mt-6 px-6 py-3 text-sm font-bold rounded-full mango-gradient text-white"
      >
        <Plus className="w-4 h-4 mr-1" /> 대회 제보하기
      </Link>
    </div>
  )
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const image =
    tournament.poster_url ??
    'https://placehold.co/600x600/FF8C42/ffffff?text=Tournament'
  const date = new Date(tournament.starts_on).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="flex bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--brand-primary)] hover:shadow-md transition-all"
    >
      <div className="relative w-24 sm:w-28 flex-shrink-0 bg-[var(--muted)]">
        <Image
          src={image}
          alt={tournament.title}
          fill
          sizes="(max-width: 640px) 96px, 112px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`px-2 py-0.5 rounded-full font-bold ${
              tournament.source === 'mango'
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}
          >
            {tournament.source === 'mango' ? '망고' : '외부'}
          </span>
          {tournament.status === 'open' && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
              모집중
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-bold text-[var(--brand-dark)] truncate">
          {tournament.title}
        </h3>
        <p className="mt-1 text-xs text-[var(--brand-dark)] flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {date}
        </p>
        {(tournament.venue_name || tournament.region_sigungu) && (
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)] truncate flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {tournament.venue_name ??
              `${tournament.region_sido} ${tournament.region_sigungu}`}
          </p>
        )}
        {tournament.prize && (
          <p className="mt-1 text-xs text-[var(--brand-primary)] font-bold truncate">
            🏆 {tournament.prize}
          </p>
        )}
      </div>
    </Link>
  )
}
