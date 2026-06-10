import { MessageCircle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: '채팅 — 망고' }

export default function ChatPage() {
  return (
    <div className="flex flex-col flex-1 pb-20">
      <SiteHeader />

      <header className="max-w-2xl w-full mx-auto px-5 pt-6">
        <h1 className="text-2xl font-black text-[var(--brand-dark)]">채팅</h1>
      </header>

      <main className="max-w-2xl w-full mx-auto px-5 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-bg-warm)] flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-[var(--brand-primary)]" />
        </div>
        <p className="font-bold text-[var(--brand-dark)]">채팅 목록이 없어요</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          매치에 참가하면 그룹 채팅이 시작됩니다
        </p>
      </main>
    </div>
  )
}
