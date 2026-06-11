import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: '모임 만들기 — 망고' }

// Phase 1 안내 화면. 실제 생성 폼은 Phase 1.5에서 (Server Action + RLS 검증)
export default function NewClubPage() {
  return (
    <div className="flex flex-col flex-1 pb-24">
      <SiteHeader />

      <div className="max-w-2xl w-full mx-auto px-5 pt-6 flex items-center gap-3">
        <Link
          href="/clubs"
          aria-label="뒤로"
          className="p-1 -ml-1 rounded hover:bg-[var(--muted)]"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--brand-dark)]" />
        </Link>
        <h1 className="text-xl font-black text-[var(--brand-dark)]">모임 만들기</h1>
      </div>

      <main className="max-w-2xl w-full mx-auto px-5 py-12 flex-1">
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 text-center">
          <div className="text-5xl mb-4">🏸</div>
          <h2 className="font-black text-[var(--brand-dark)]">곧 만나봐요!</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            모임 만들기 기능은 베타 기간 중<br />
            카카오톡으로 신청하면 자비스가 직접 등록해드려요
          </p>
          <a
            href="https://open.kakao.com/o/example"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-6 px-6 py-3 text-sm font-bold rounded-full mango-gradient text-white"
          >
            카카오톡 오픈채팅으로 신청
          </a>
          <p className="mt-6 text-xs text-[var(--muted-foreground)]">
            정식 출시 시 회장 권한으로 직접 만들 수 있어요
          </p>
        </div>
      </main>
    </div>
  )
}
