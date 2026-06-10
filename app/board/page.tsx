import { MessageSquare } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: '담벼락 — 망고' }

export default function BoardPage() {
  return (
    <div className="flex flex-col flex-1 pb-20">
      <SiteHeader />

      <header className="max-w-2xl w-full mx-auto px-5 pt-6">
        <h1 className="text-2xl font-black text-[var(--brand-dark)]">담벼락</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          동호인들과 자유롭게 소통해요
        </p>
      </header>

      <main className="max-w-2xl w-full mx-auto px-5 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-bg-warm)] flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-[var(--brand-primary)]" />
        </div>
        <p className="font-bold text-[var(--brand-dark)]">담벼락은 준비 중이에요</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-xs">
          매치 후기, 셔틀콕 추천, Q&amp;A 등 자유 게시판이 곧 열립니다
        </p>
      </main>
    </div>
  )
}
