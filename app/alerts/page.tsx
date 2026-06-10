import { Bell } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export const metadata = { title: '알림 — 망고' }

export default function AlertsPage() {
  return (
    <div className="flex flex-col flex-1 pb-20">
      <SiteHeader />

      <header className="max-w-2xl w-full mx-auto px-5 pt-6">
        <h1 className="text-2xl font-black text-[var(--brand-dark)]">알림</h1>
      </header>

      <main className="max-w-2xl w-full mx-auto px-5 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-bg-warm)] flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-[var(--brand-primary)]" />
        </div>
        <p className="font-bold text-[var(--brand-dark)]">아직 알림이 없어요</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          매치 신청·승인·시작 알림이 여기 표시됩니다
        </p>
        <p className="mt-6 text-xs text-[var(--muted-foreground)]">
          💌 카카오 알림톡은 비즈 앱 전환 후 활성화 예정
        </p>
      </main>
    </div>
  )
}
