import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: '대회 제보 — 망고' }

// Phase 1 안내. 정식 폼은 Phase 1.5 (UGC + 자비스 승인 큐)
export default function NewTournamentPage() {
  return (
    <div className="flex flex-col flex-1 pb-24">
      <SiteHeader />

      <div className="max-w-2xl w-full mx-auto px-5 pt-6 flex items-center gap-3">
        <Link
          href="/tournaments"
          aria-label="뒤로"
          className="p-1 -ml-1 rounded hover:bg-[var(--muted)]"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--brand-dark)]" />
        </Link>
        <h1 className="text-xl font-black text-[var(--brand-dark)]">대회 제보</h1>
      </div>

      <main className="max-w-2xl w-full mx-auto px-5 py-12 flex-1">
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="font-black text-[var(--brand-dark)]">알고 있는 대회 정보를 알려주세요</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            제보 폼은 곧 열려요!<br />
            그 전엔 카카오톡으로 보내주시면<br />
            자비스가 직접 등록해드려요
          </p>
          <a
            href="https://open.kakao.com/o/example"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-6 px-6 py-3 text-sm font-bold rounded-full mango-gradient text-white"
          >
            카카오톡으로 제보
          </a>
          <p className="mt-6 text-xs text-[var(--muted-foreground)] leading-relaxed">
            대회명 · 일정 · 장소 · 참가 신청 링크<br />
            (포스터 이미지 있으면 더 좋아요)
          </p>
        </div>
      </main>
    </div>
  )
}
