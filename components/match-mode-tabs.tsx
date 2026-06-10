import Link from 'next/link'
import type { MatchMode } from '@/types/database'

const TABS: { mode: MatchMode; label: string; desc: string }[] = [
  { mode: 'social', label: '친목', desc: '게임데이 · 자유 페어' },
  { mode: 'skill', label: '급수', desc: '실력 매칭' },
  { mode: 'court', label: '체육관', desc: '직접 예약 (준비 중)' },
]

export function MatchModeTabs({ current }: { current: MatchMode }) {
  return (
    <nav className="bg-white border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex">
          {TABS.map((tab) => {
            const active = tab.mode === current
            return (
              <Link
                key={tab.mode}
                href={`/matches?mode=${tab.mode}`}
                aria-current={active ? 'page' : undefined}
                className={`flex-1 text-center py-3 border-b-2 transition ${
                  active
                    ? 'border-[var(--brand-primary)] text-[var(--brand-dark)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--brand-dark)]'
                }`}
              >
                <span
                  className={`text-base ${
                    active ? 'font-black' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
