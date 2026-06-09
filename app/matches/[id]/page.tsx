import { notFound } from 'next/navigation'
import { MapPin, Clock, Users, Calendar, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { MatchActions } from '@/components/match-actions'
import { formatGrade, formatMatchType } from '@/lib/utils'
import type {
  Match,
  Court,
  Profile,
  MatchParticipant,
} from '@/types/database'

type MatchDetail = Match & {
  courts: Pick<Court, 'name' | 'address' | 'region_sigungu' | 'phone'> | null
  host: Pick<Profile, 'id' | 'nickname' | 'avatar_url' | 'self_grade' | 'elo_rating'> | null
}

type ParticipantWithProfile = MatchParticipant & {
  user: Pick<Profile, 'id' | 'nickname' | 'avatar_url' | 'self_grade'> | null
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let match: MatchDetail | null = null
  let participants: ParticipantWithProfile[] = []
  let currentUserId: string | null = null
  let myStatus: ParticipantWithProfile['status'] | 'host' | null = null

  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    currentUserId = auth.user?.id ?? null

    const { data: m } = await supabase
      .from('matches')
      .select(
        '*, courts(name, address, region_sigungu, phone), host:profiles!matches_host_id_fkey(id, nickname, avatar_url, self_grade, elo_rating)'
      )
      .eq('id', id)
      .single<MatchDetail>()

    match = m
    if (!match) notFound()

    const { data: p } = await supabase
      .from('match_participants')
      .select('*, user:profiles!match_participants_user_id_fkey(id, nickname, avatar_url, self_grade)')
      .eq('match_id', id)
      .order('created_at', { ascending: true })

    participants = (p ?? []) as unknown as ParticipantWithProfile[]

    if (currentUserId === match.host_id) {
      myStatus = 'host'
    } else if (currentUserId) {
      const mine = participants.find((pp) => pp.user_id === currentUserId)
      myStatus = mine?.status ?? null
    }
  } catch {
    // .env.local 미설정 시 안내
  }

  if (!match) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="text-center">
            <p className="text-2xl mb-2">🥭</p>
            <p className="font-bold text-[var(--brand-dark)]">매치를 찾을 수 없습니다</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Supabase 연결 전이거나 삭제된 매치일 수 있어요
            </p>
          </div>
        </main>
      </div>
    )
  }

  const scheduled = new Date(match.scheduled_at)
  const dateStr = scheduled.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const timeStr = scheduled.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const approved = participants.filter((p) => p.status === 'approved')
  const pending = participants.filter((p) => p.status === 'pending')

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="max-w-2xl w-full mx-auto px-5 py-6 flex-1 space-y-5">
        {/* 매치 헤더 */}
        <section className="p-5 bg-white rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-[var(--brand-bg-warm)] text-[var(--brand-primary)] font-bold">
              {formatMatchType(match.match_type)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-bold">
              {formatGrade(match.grade_min)}~{formatGrade(match.grade_max)}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold ml-auto ${statusStyle(match.status)}`}
            >
              {statusLabel(match.status)}
            </span>
          </div>
          <h1 className="mt-3 text-xl font-black text-[var(--brand-dark)]">
            {match.title}
          </h1>
          {match.description && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">
              {match.description}
            </p>
          )}

          <div className="mt-5 space-y-2.5 text-sm">
            <InfoRow icon={<Calendar className="w-4 h-4" />}>
              <span className="font-bold text-[var(--brand-dark)]">{dateStr}</span>
              <span className="ml-2 text-[var(--brand-primary)] font-black">{timeStr}</span>
            </InfoRow>
            <InfoRow icon={<Clock className="w-4 h-4" />}>
              진행 시간 {match.duration_minutes}분
            </InfoRow>
            <InfoRow icon={<MapPin className="w-4 h-4" />}>
              <div>
                <p className="font-medium text-[var(--brand-dark)]">
                  {match.courts?.name ?? match.custom_location ?? '장소 미정'}
                </p>
                {match.courts && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {match.courts.address}
                    {match.courts.phone && ` · ${match.courts.phone}`}
                  </p>
                )}
              </div>
            </InfoRow>
            <InfoRow icon={<Users className="w-4 h-4" />}>
              <span className="font-bold text-[var(--brand-dark)]">
                {match.current_participants}/{match.max_participants}명
              </span>
              <span className="text-[var(--muted-foreground)] ml-1.5">참가 중</span>
            </InfoRow>
            {match.cost_per_person > 0 && (
              <InfoRow icon={<Wallet className="w-4 h-4" />}>
                1인당 {match.cost_per_person.toLocaleString()}원
              </InfoRow>
            )}
          </div>
        </section>

        {/* 호스트 */}
        {match.host && (
          <section className="p-5 bg-white rounded-2xl border border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--muted-foreground)] mb-2">호스트</p>
            <ProfileChip profile={match.host} elo={match.host.elo_rating} />
          </section>
        )}

        {/* 참가자 */}
        <section className="p-5 bg-white rounded-2xl border border-[var(--border)]">
          <p className="text-xs font-bold text-[var(--muted-foreground)] mb-3">
            확정 참가자 ({approved.length}명)
          </p>
          {approved.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">아직 호스트만 있어요</p>
          ) : (
            <ul className="space-y-2">
              {approved.map((p) =>
                p.user ? (
                  <li key={p.id}>
                    <ProfileChip profile={p.user} />
                  </li>
                ) : null
              )}
            </ul>
          )}

          {myStatus === 'host' && pending.length > 0 && (
            <>
              <p className="text-xs font-bold text-[var(--brand-primary)] mt-5 mb-3">
                ⚡ 승인 대기 ({pending.length}명)
              </p>
              <ul className="space-y-2">
                {pending.map((p) =>
                  p.user ? (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--brand-bg-warm)]"
                    >
                      <ProfileChip profile={p.user} />
                      <MatchActions
                        kind="decide"
                        participantId={p.id}
                        className="ml-auto"
                      />
                    </li>
                  ) : null
                )}
              </ul>
            </>
          )}
        </section>

        {/* 액션 */}
        <MatchActions
          kind="bottom"
          matchId={match.id}
          currentUserId={currentUserId}
          hostId={match.host_id}
          isFull={match.current_participants >= match.max_participants}
          status={match.status}
          myStatus={myStatus === 'host' ? null : myStatus}
        />
      </main>
    </div>
  )
}

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex-shrink-0 mt-0.5 text-[var(--muted-foreground)]">{icon}</span>
      <div className="text-sm text-[var(--brand-dark)]">{children}</div>
    </div>
  )
}

function ProfileChip({
  profile,
  elo,
}: {
  profile: Pick<Profile, 'nickname' | 'avatar_url' | 'self_grade'>
  elo?: number
}) {
  return (
    <div className="flex items-center gap-3">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.nickname}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <span className="w-10 h-10 rounded-full bg-[var(--brand-primary)] text-white font-bold flex items-center justify-center">
          {profile.nickname[0]}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-bold text-[var(--brand-dark)] truncate">{profile.nickname}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {formatGrade(profile.self_grade)}
          {typeof elo === 'number' && ` · Elo ${elo}`}
        </p>
      </div>
    </div>
  )
}

function statusLabel(status: string) {
  return (
    { open: '모집중', full: '인원 충족', in_progress: '진행중', completed: '완료', cancelled: '취소' } as Record<string, string>
  )[status] ?? status
}
function statusStyle(status: string) {
  return (
    {
      open: 'bg-[var(--brand-accent)]/15 text-[var(--brand-accent)]',
      full: 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-600',
    } as Record<string, string>
  )[status] ?? 'bg-gray-100 text-gray-600'
}
