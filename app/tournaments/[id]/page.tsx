import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Trophy, Wallet, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Tournament } from '@/types/database'

export const metadata = { title: '대회 — 망고' }

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let tournament: Tournament | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .maybeSingle<Tournament>()
    tournament = data
  } catch {
    // .env.local 미설정 시
  }

  if (!tournament) notFound()

  const poster =
    tournament.poster_url ??
    'https://placehold.co/600x600/FF8C42/ffffff?text=Tournament'

  return (
    <div className="flex flex-col flex-1 pb-32">
      <header className="sticky top-0 z-20 bg-white border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <Link
            href="/tournaments"
            aria-label="뒤로"
            className="p-1 -ml-1 rounded hover:bg-[var(--muted)]"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--brand-dark)]" />
          </Link>
          <h1 className="text-sm font-black text-[var(--brand-dark)] truncate flex-1">
            {tournament.title}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl w-full mx-auto px-5 py-5 space-y-4">
        {/* 포스터 */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--muted)] max-w-sm mx-auto">
          <Image
            src={poster}
            alt={tournament.title}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-contain"
            priority
          />
        </div>

        {/* 타이틀 영역 */}
        <section>
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`px-2.5 py-1 rounded-full font-bold ${
                tournament.source === 'mango'
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}
            >
              {tournament.source === 'mango' ? '망고 등록' : '외부 대회'}
            </span>
            {tournament.status === 'open' && (
              <span className="px-2.5 py-1 rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
                모집중
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-black text-[var(--brand-dark)]">
            {tournament.title}
          </h2>
          {tournament.organizer && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              주최 · {tournament.organizer}
            </p>
          )}
        </section>

        {/* 기본 정보 */}
        <section className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <h3 className="px-5 pt-5 pb-3 text-base font-black text-[var(--brand-dark)]">
            기본 정보
          </h3>
          <div className="px-5 pb-5 space-y-3 text-sm">
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="일정">
              <span className="font-medium text-[var(--brand-dark)]">
                {new Date(tournament.starts_on).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
                {tournament.ends_on && tournament.ends_on !== tournament.starts_on && (
                  <>
                    {' ~ '}
                    {new Date(tournament.ends_on).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </>
                )}
              </span>
            </InfoRow>
            {tournament.venue_name && (
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="장소">
                {tournament.venue_name}
                {tournament.region_sigungu && (
                  <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">
                    {tournament.region_sido} {tournament.region_sigungu}
                  </span>
                )}
              </InfoRow>
            )}
            {tournament.prize && (
              <InfoRow icon={<Trophy className="w-4 h-4" />} label="시상">
                <span className="font-bold text-[var(--brand-primary)]">
                  {tournament.prize}
                </span>
              </InfoRow>
            )}
            {tournament.fee && (
              <InfoRow icon={<Wallet className="w-4 h-4" />} label="참가비">
                {tournament.fee.toLocaleString()}원
              </InfoRow>
            )}
          </div>
        </section>

        {/* 상세 설명 */}
        {tournament.description && (
          <section className="bg-white rounded-2xl border border-[var(--border)] p-5">
            <h3 className="text-base font-black text-[var(--brand-dark)] mb-2">상세 안내</h3>
            <p className="text-sm text-[var(--brand-dark)] whitespace-pre-wrap leading-relaxed">
              {tournament.description}
            </p>
          </section>
        )}
      </main>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--border)] safe-area-bottom">
        <div className="max-w-2xl mx-auto px-5 py-3">
          {tournament.registration_url ? (
            <a
              href={tournament.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-2xl mango-gradient text-white font-bold flex items-center justify-center gap-1.5"
            >
              참가 신청하러 가기
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full h-12 rounded-2xl mango-gradient text-white font-bold disabled:opacity-50"
            >
              신청 링크 준비 중
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 w-20 flex-shrink-0 text-[var(--muted-foreground)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 text-[var(--brand-dark)]">{children}</div>
    </div>
  )
}
