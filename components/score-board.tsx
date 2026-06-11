'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Save, Trophy } from 'lucide-react'
import { saveScore } from '@/app/actions/score'

type ScoreBoardProps = {
  matchId: string
  initialSetNumber?: number
  initialTeamALabel?: string
  initialTeamBLabel?: string
  initialTeamA?: number
  initialTeamB?: number
}

export function ScoreBoard({
  matchId,
  initialSetNumber = 1,
  initialTeamALabel = '청팀',
  initialTeamBLabel = '백팀',
  initialTeamA = 0,
  initialTeamB = 0,
}: ScoreBoardProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [setNumber, setSetNumber] = useState(initialSetNumber)
  const [labelA, setLabelA] = useState(initialTeamALabel)
  const [labelB, setLabelB] = useState(initialTeamBLabel)
  const [scoreA, setScoreA] = useState(initialTeamA)
  const [scoreB, setScoreB] = useState(initialTeamB)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function adjust(team: 'a' | 'b', delta: number) {
    if (team === 'a') setScoreA((v) => Math.max(0, Math.min(99, v + delta)))
    else setScoreB((v) => Math.max(0, Math.min(99, v + delta)))
    setSaved(false)
  }

  function reset() {
    setScoreA(0)
    setScoreB(0)
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const r = await saveScore({
        match_id: matchId,
        set_number: setNumber,
        team_a_label: labelA,
        team_b_label: labelB,
        team_a_score: scoreA,
        team_b_score: scoreB,
      })
      if (!r.ok) setError(r.error)
      else {
        setSaved(true)
        router.refresh()
      }
    })
  }

  const winner = scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : null

  return (
    <div className="space-y-5">
      {/* 세트 선택 */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSetNumber(n)}
            className={`w-10 h-10 rounded-full text-sm font-black transition ${
              setNumber === n
                ? 'mango-gradient text-white shadow'
                : 'bg-white border border-[var(--border)] text-[var(--brand-dark)]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* 점수판 */}
      <div className="grid grid-cols-2 gap-3">
        <TeamScore
          label={labelA}
          onLabelChange={setLabelA}
          score={scoreA}
          onPlus={() => adjust('a', 1)}
          onMinus={() => adjust('a', -1)}
          isWinner={winner === 'a'}
          tone="primary"
        />
        <TeamScore
          label={labelB}
          onLabelChange={setLabelB}
          score={scoreB}
          onPlus={() => adjust('b', 1)}
          onMinus={() => adjust('b', -1)}
          isWinner={winner === 'b'}
          tone="accent"
        />
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex-1 h-12 rounded-2xl bg-white border border-[var(--border)] text-sm font-bold text-[var(--brand-dark)] hover:border-[var(--brand-dark)] transition"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex-1 h-12 rounded-2xl mango-gradient text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:brightness-95 transition disabled:opacity-60"
        >
          {pending ? (
            '저장 중...'
          ) : saved ? (
            <>
              <Trophy className="w-4 h-4" />
              저장됨!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              세트 {setNumber} 저장
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-center text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {error}
        </p>
      )}
    </div>
  )
}

function TeamScore({
  label,
  onLabelChange,
  score,
  onPlus,
  onMinus,
  isWinner,
  tone,
}: {
  label: string
  onLabelChange: (v: string) => void
  score: number
  onPlus: () => void
  onMinus: () => void
  isWinner: boolean
  tone: 'primary' | 'accent'
}) {
  const borderClass = isWinner
    ? tone === 'primary'
      ? 'border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/20'
      : 'border-[var(--brand-accent)] shadow-lg shadow-[var(--brand-accent)]/20'
    : 'border-[var(--border)]'

  return (
    <div
      className={`flex flex-col items-center p-4 bg-white rounded-2xl border-2 transition-all ${borderClass}`}
    >
      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        maxLength={10}
        aria-label="팀 이름"
        className="w-full text-center text-sm font-bold text-[var(--muted-foreground)] bg-transparent outline-none focus:text-[var(--brand-dark)]"
      />
      <p className="my-3 text-6xl font-black text-[var(--brand-dark)] tabular-nums">
        {score}
      </p>
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          onClick={onMinus}
          aria-label="감점"
          className="flex-1 h-11 rounded-xl bg-[var(--muted)] text-[var(--brand-dark)] flex items-center justify-center hover:bg-[var(--brand-bg-warm)] transition"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onPlus}
          aria-label="가점"
          className="flex-1 h-11 rounded-xl mango-gradient text-white flex items-center justify-center hover:brightness-95 transition"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
