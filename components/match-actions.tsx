'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { applyToMatch, decideParticipant } from '@/app/actions/match'

type DecideProps = {
  kind: 'decide'
  participantId: string
  className?: string
}

type BottomProps = {
  kind: 'bottom'
  matchId: string
  currentUserId: string | null
  hostId: string
  isFull: boolean
  status: string
  myStatus: 'pending' | 'approved' | 'rejected' | 'attended' | 'no_show' | null
}

export function MatchActions(props: DecideProps | BottomProps) {
  if (props.kind === 'decide') return <DecideButtons {...props} />
  return <BottomCTA {...props} />
}

function DecideButtons({ participantId, className }: DecideProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function decide(decision: 'approved' | 'rejected') {
    setError(null)
    startTransition(async () => {
      const r = await decideParticipant(participantId, decision)
      if (!r.ok) setError(r.error)
      else router.refresh()
    })
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => decide('approved')}
        disabled={pending}
        className="px-3 h-9 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-bold hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
      >
        승인
      </button>
      <button
        type="button"
        onClick={() => decide('rejected')}
        disabled={pending}
        className="px-3 h-9 rounded-lg bg-white text-[var(--muted-foreground)] text-xs font-bold border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50"
      >
        거절
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

function BottomCTA({
  matchId,
  currentUserId,
  hostId,
  isFull,
  status,
  myStatus,
}: BottomProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!currentUserId) {
    return (
      <Link
        href={`/login?next=/matches/${matchId}`}
        className="block w-full h-12 rounded-2xl bg-[var(--brand-primary)] text-white font-bold text-center leading-[3rem] hover:bg-[var(--brand-primary-hover)] transition"
      >
        로그인하고 참가 신청
      </Link>
    )
  }

  if (currentUserId === hostId) {
    return (
      <div className="p-4 bg-[var(--brand-bg-warm)] rounded-2xl text-center text-sm text-[var(--brand-dark)]">
        🥭 내가 호스트인 매치입니다
      </div>
    )
  }

  if (status !== 'open') {
    return (
      <div className="p-4 bg-[var(--muted)] rounded-2xl text-center text-sm text-[var(--muted-foreground)]">
        모집이 마감된 매치입니다
      </div>
    )
  }

  if (myStatus === 'pending') {
    return (
      <div className="p-4 bg-[var(--brand-bg-warm)] rounded-2xl text-center text-sm text-[var(--brand-primary)] font-bold">
        ⏳ 호스트 승인 대기 중
      </div>
    )
  }

  if (myStatus === 'approved' || myStatus === 'attended') {
    return (
      <div className="p-4 bg-[var(--brand-accent)]/15 rounded-2xl text-center text-sm text-[var(--brand-accent)] font-bold">
        ✓ 참가 확정! 매치 시간에 만나요
      </div>
    )
  }

  if (myStatus === 'rejected') {
    return (
      <div className="p-4 bg-red-50 rounded-2xl text-center text-sm text-red-600">
        아쉽게도 이번 매치는 참가가 어려워요
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="p-4 bg-[var(--muted)] rounded-2xl text-center text-sm text-[var(--muted-foreground)]">
        인원이 가득 찼어요
      </div>
    )
  }

  function apply() {
    setError(null)
    startTransition(async () => {
      const r = await applyToMatch(matchId, message || undefined)
      if (!r.ok) setError(r.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {showInput && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="(선택) 호스트에게 한마디 — 실력, 도착 시간 등"
          className="input"
        />
      )}
      <button
        type="button"
        onClick={() => {
          if (!showInput) setShowInput(true)
          else apply()
        }}
        disabled={pending}
        className="w-full h-12 rounded-2xl bg-[var(--brand-primary)] text-white font-bold hover:bg-[var(--brand-primary-hover)] transition disabled:opacity-50"
      >
        {pending ? '신청 중...' : showInput ? '참가 신청 보내기' : '참가 신청하기'}
      </button>
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
