'use client'

import { Calendar, Clock, MapPin, Trophy, ChevronDown } from 'lucide-react'

// Phase 1: UI 표시만 (실제 필터링은 Phase 2에서 search params로 연결)
const FILTERS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'date', label: '날짜', icon: <Calendar className="w-3.5 h-3.5" /> },
  { key: 'time', label: '시간', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'court', label: '체육관', icon: <MapPin className="w-3.5 h-3.5" /> },
  { key: 'grade', label: '급수', icon: <Trophy className="w-3.5 h-3.5" /> },
]

export function MatchFilters() {
  return (
    <div className="bg-white border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            disabled
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-white text-xs font-medium text-[var(--brand-dark)] hover:border-[var(--brand-primary)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            title="필터 기능 준비 중"
          >
            {f.icon}
            {f.label}
            <ChevronDown className="w-3 h-3" />
          </button>
        ))}
      </div>
    </div>
  )
}
