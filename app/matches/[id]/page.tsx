import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, Calendar, Clock, Users, Wallet, Trophy, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MatchActions } from '@/components/match-actions'
import { Countdown } from '@/components/countdown'
import { CopyButton } from '@/components/copy-button'
import { formatGrade, formatMatchType } from '@/lib/utils'
import type {
  Match,
  Court,
  Profile,
  MatchParticipant,
} from '@/types/database'

type MatchDetail = Match & {
  courts: Pick<
    Court,
    'name' | 'address' | 'region_sigungu' | 'phone' | 'image_url'
  > | null
  host: Pick<
    Profile,
    'id' | 'nickname' | 'avatar_url' | 'self_grade' | 'elo_rating' | 'satisfaction_rate' | 'review_count'
  > | null
}

type ParticipantWithProfile = MatchParticipant & {
  user: Pick<Profile, 'id' | 'nickname' | 'avatar_url' | 'self_grade' | 'manner_score'> | null
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
        '*, courts(name, address, region_sigungu, phone, image_url), host:profiles!matches_host_id_fkey(id, nickname, avatar_url, self_grade, elo_rating, satisfaction_rate, review_count)'
      )
      .eq('id', id)
      .single<MatchDetail>()

    match = m
    if (!match) notFound()

    const { data: p } = await supabase
      .from('match_participants')
      .select('*, user:profiles!match_participants_user_id_fkey(id, nickname, avatar_url, self_grade, manner_score)')
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
    // .env.local 미설정 시
  }

  if (!match) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-5 py-12">
        <div className="text-center">
          <p className="text-2xl mb-2">🥭</p>
          <p className="font-bold text-[var(--brand-dark)]">매치를 찾을 수 없습니다</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Supabase 연결 전이거나 삭제된 매치일 수 있어요
          </p>
          <Link href="/matches" className="inline-block mt-6 text-sm text-[var(--brand-primary)] font-bold">
            ← 매치 목록으로
          </Link>
        </div>
      </div>
    )
  }

  const scheduled = new Date(match.scheduled_at)
  const dateStr = scheduled.toLocaleDateString('ko-KR', {
    month: 'long',
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

  const approved = participants.filter((p) => p.status === 'approved')
  const pending = participants.filter((p) => p.status === 'pending')
  const remaining = match.max_participants - match.current_participants
  const courtImage =
    match.courts?.image_url ??
    'https://placehold.co/1200x600/FFF4E0/3D2817?text=Mango+Court'
  const courtName = match.courts?.name ?? match.custom_location ?? '장소 미정'
  const fullAddress = match.courts?.address ?? match.custom_location ?? ''

  return (
    <div className="flex flex-col flex-1 pb-32">
      {/* 큰 코트 사진 헤더 (스매시 패턴) */}
      <div className="relative w-full aspect-[16/9] bg-[var(--muted)]">
        <Image
          src={courtImage}
          alt={courtName}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <Link
          href="/matches"
          aria-label="뒤로"
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--brand-dark)]" />
        </Link>
      </div>

      <main className="max-w-2xl w-full mx-auto px-5 flex-1 space-y-4">
        {/* 타이틀 + 호스트 신뢰도 (스매시 패턴) */}
        <section className="pt-5">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-[var(--brand-bg-warm)] text-[var(--brand-primary)] font-bold">
              {formatMatchType(match.match_type)}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
              {formatGrade(match.grade_min)}~{formatGrade(match.grade_max)}
            </span>
            <span className={`px-2.5 py-1 rounded-full font-bold ml-auto ${statusStyle(match.status)}`}>
              {statusLabel(match.status)}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-black text-[var(--brand-dark)] leading-tight">
            {courtName}
          </h1>
          {match.courts?.region_sigungu && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {match.courts.region_sigungu}
            </p>
          )}

          {/* 호스트 신뢰도 (스매시: 매칭 만족도 93% · 후기 19개) */}
          {match.host && (
            <div className="mt-4 flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-[var(--border)]">
              {match.host.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.host.avatar_url}
                  alt={match.host.nickname}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="w-12 h-12 rounded-full mango-gradient text-white font-black text-lg flex items-center justify-center">
                  {match.host.nickname[0]}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--muted-foreground)]">호스트</p>
                <p className="font-bold text-[var(--brand-dark)] truncate flex items-center gap-1.5">
                  {match.host.nickname}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
                    {formatGrade(match.host.self_grade)}
                  </span>
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {match.host.satisfaction_rate !== null ? (
                    <>
                      매칭 만족도 <span className="text-[var(--brand-primary)] font-bold">{match.host.satisfaction_rate}%</span>
                      <span className="mx-1">·</span>
                      후기 {match.host.review_count}개
                    </>
                  ) : (
                    <>신규 호스트 · 첫 매치를 시작해요</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 긴급성 배지 */}
          {match.status === 'open' && remaining > 0 && remaining <= 2 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold">
              🔔 마감까지 {remaining}자리 남았어요
            </div>
          )}
        </section>

        {/* 기본 정보 표 (스매시 패턴) */}
        <section className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <h2 className="px-5 pt-5 pb-3 text-base font-black text-[var(--brand-dark)]">
            기본 정보
          </h2>
          <div className="px-5 pb-5 space-y-3 text-sm">
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="일시">
              <span className="font-medium text-[var(--brand-dark)]">{dateStr}</span>
              <span className="ml-2 text-[var(--brand-primary)] font-black">
                {startTime}~{endTime}
              </span>
            </InfoRow>
            <InfoRow icon={<Clock className="w-4 h-4" />} label="진행 시간">
              {match.duration_minutes}분
            </InfoRow>
            <InfoRow icon={<Users className="w-4 h-4" />} label="모집 인원">
              <span className="font-bold text-[var(--brand-dark)]">
                {match.current_participants}/{match.max_participants}명
              </span>
              {remaining > 0 && (
                <span className="ml-2 text-[var(--brand-primary)]">
                  · {remaining}자리 남음
                </span>
              )}
            </InfoRow>
            <InfoRow icon={<Trophy className="w-4 h-4" />} label="실력 조건">
              {formatGrade(match.grade_min)} ~ {formatGrade(match.grade_max)}
            </InfoRow>
            <InfoRow icon={<Wallet className="w-4 h-4" />} label="매칭비">
              {match.cost_per_person > 0 ? (
                <span className="font-bold text-[var(--brand-dark)]">
                  {match.cost_per_person.toLocaleString()}원
                </span>
              ) : (
                <span className="text-[var(--brand-accent)] font-bold">무료</span>
              )}
            </InfoRow>
          </div>
        </section>

        {/* 위치 정보 (주소 복사 — 스매시 패턴) */}
        <section className="bg-white rounded-2xl border border-[var(--border)] p-5">
          <h2 className="text-base font-black text-[var(--brand-dark)] mb-3">위치 정보</h2>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--brand-dark)]">{courtName}</p>
              {fullAddress && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)] break-all">
                  {fullAddress}
                </p>
              )}
              {match.courts?.phone && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  📞 {match.courts.phone}
                </p>
              )}
            </div>
            {fullAddress && <CopyButton text={fullAddress} label="주소 복사" />}
          </div>
        </section>

        {/* 매칭 소개 */}
        {match.description && (
          <section className="bg-white rounded-2xl border border-[var(--border)] p-5">
            <h2 className="text-base font-black text-[var(--brand-dark)] mb-2">매칭 소개</h2>
            <p className="text-sm text-[var(--brand-dark)] whitespace-pre-wrap leading-relaxed">
              {match.description}
            </p>
          </section>
        )}

        {/* 스코어 보드 진입 (참가자만 — 클라이언트에서 자동 가드) */}
        {(myStatus === 'host' || myStatus === 'approved' || myStatus === 'attended') && (
          <Link
            href={`/matches/${match.id}/score`}
            className="block p-4 bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--brand-primary)] transition"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl mango-gradient text-white flex items-center justify-center text-xl">
                🏸
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--brand-dark)]">임시 스코어 보드</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  게임 중 점수를 빠르게 기록하세요
                </p>
              </div>
              <span className="text-[var(--brand-primary)] font-bold text-sm">기록 →</span>
            </div>
          </Link>
        )}

        {/* 참가자 아바타 그리드 (스매시 패턴) */}
        <section className="bg-white rounded-2xl border border-[var(--border)] p-5">
          <h2 className="text-base font-black text-[var(--brand-dark)]">
            확정 참가자 <span className="text-[var(--brand-primary)]">{approved.length}</span>
            <span className="text-[var(--muted-foreground)]"> / {match.max_participants}명</span>
          </h2>

          {approved.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              아직 호스트만 있어요. 첫 참가자가 되어보세요!
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {approved.map((p) =>
                p.user ? (
                  <li key={p.id} className="text-center">
                    <ParticipantAvatar profile={p.user} />
                  </li>
                ) : null
              )}
            </ul>
          )}

          {myStatus === 'host' && pending.length > 0 && (
            <>
              <p className="mt-5 text-xs font-bold text-[var(--brand-primary)]">
                ⚡ 승인 대기 ({pending.length}명)
              </p>
              <ul className="mt-2 space-y-2">
                {pending.map((p) =>
                  p.user ? (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--brand-bg-warm)]"
                    >
                      <ParticipantAvatar profile={p.user} small />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--brand-dark)] truncate">
                          {p.user.nickname}
                        </p>
                        {p.message && (
                          <p className="text-xs text-[var(--muted-foreground)] truncate">
                            "{p.message}"
                          </p>
                        )}
                      </div>
                      <MatchActions kind="decide" participantId={p.id} />
                    </li>
                  ) : null
                )}
              </ul>
            </>
          )}
        </section>
      </main>

      {/* 하단 고정 CTA + 카운트다운 (스매시 패턴) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--border)] safe-area-bottom">
        {match.status === 'open' && (
          <div className="px-5 py-1.5 bg-[var(--brand-bg-warm)] text-center text-xs font-bold text-[var(--brand-primary)]">
            ⏱️ <Countdown targetIso={match.scheduled_at} />
          </div>
        )}
        <div className="max-w-2xl mx-auto px-5 py-3">
          <MatchActions
            kind="bottom"
            matchId={match.id}
            currentUserId={currentUserId}
            hostId={match.host_id}
            isFull={match.current_participants >= match.max_participants}
            status={match.status}
            myStatus={myStatus === 'host' ? null : myStatus}
          />
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
      <div className="flex items-center gap-1.5 w-24 flex-shrink-0 text-[var(--muted-foreground)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 text-[var(--brand-dark)]">{children}</div>
    </div>
  )
}

function ParticipantAvatar({
  profile,
  small,
}: {
  profile: Pick<Profile, 'nickname' | 'avatar_url' | 'self_grade'>
  small?: boolean
}) {
  const size = small ? 'w-10 h-10' : 'w-14 h-14'
  return (
    <div className="flex flex-col items-center gap-1">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.nickname}
          className={`${size} rounded-full object-cover`}
        />
      ) : (
        <span className={`${size} rounded-full mango-gradient text-white font-black flex items-center justify-center`}>
          {profile.nickname[0]}
        </span>
      )}
      {!small && (
        <>
          <span className="text-xs font-bold text-[var(--brand-dark)] truncate max-w-full">
            {profile.nickname}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
            {formatGrade(profile.self_grade)}
          </span>
        </>
      )}
    </div>
  )
}

function statusLabel(status: string) {
  return (
    {
      open: '모집중',
      full: '인원 충족',
      in_progress: '진행중',
      completed: '완료',
      cancelled: '취소',
    } as Record<string, string>
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
