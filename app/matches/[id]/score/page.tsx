import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScoreBoard } from '@/components/score-board'
import type { MatchScore } from '@/types/database'

export const metadata = { title: '스코어 보드 — 망고' }

export default async function ScorePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: matchId } = await params

  let matchTitle = ''
  let recentScores: MatchScore[] = []
  let isAuth = false

  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) redirect(`/login?next=/matches/${matchId}/score`)
    isAuth = true

    const { data: match } = await supabase
      .from('matches')
      .select('title')
      .eq('id', matchId)
      .maybeSingle()
    matchTitle = match?.title ?? '매치'

    const { data: scores } = await supabase
      .from('match_scores')
      .select('*')
      .eq('match_id', matchId)
      .order('set_number', { ascending: true })

    recentScores = (scores ?? []) as MatchScore[]
  } catch {
    // .env.local 미설정 시
  }

  if (!isAuth) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-5 py-12">
        <p className="text-center text-[var(--muted-foreground)]">
          Supabase 연결 후 사용 가능합니다
        </p>
      </div>
    )
  }

  const nextSetNumber =
    recentScores.length > 0
      ? Math.max(...recentScores.map((s) => s.set_number)) + 1
      : 1

  return (
    <div className="flex flex-col flex-1 pb-24">
      <header className="sticky top-0 z-20 bg-white border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <Link
            href={`/matches/${matchId}`}
            aria-label="뒤로"
            className="p-1 -ml-1 rounded hover:bg-[var(--muted)]"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--brand-dark)]" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[var(--brand-primary)]">
              스코어 보드
            </p>
            <h1 className="text-sm font-black text-[var(--brand-dark)] truncate">
              {matchTitle}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl w-full mx-auto px-5 py-6 space-y-6">
        <ScoreBoard matchId={matchId} initialSetNumber={Math.min(nextSetNumber, 5)} />

        {/* 이전 세트 기록 */}
        {recentScores.length > 0 && (
          <section className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
            <h2 className="px-5 pt-4 pb-2 text-sm font-black text-[var(--brand-dark)]">
              세트 기록
            </h2>
            <ul className="px-5 pb-4 divide-y divide-[var(--border)]">
              {recentScores.map((s) => (
                <li
                  key={s.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <span className="font-bold text-[var(--brand-dark)]">
                    세트 {s.set_number}
                  </span>
                  <span className="flex items-center gap-3 tabular-nums">
                    <span
                      className={`font-black ${
                        s.winner_team === 'a'
                          ? 'text-[var(--brand-primary)]'
                          : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {s.team_a_label ?? '청팀'} {s.team_a_score}
                    </span>
                    <span className="text-[var(--muted-foreground)]">:</span>
                    <span
                      className={`font-black ${
                        s.winner_team === 'b'
                          ? 'text-[var(--brand-accent)]'
                          : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {s.team_b_score} {s.team_b_label ?? '백팀'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
