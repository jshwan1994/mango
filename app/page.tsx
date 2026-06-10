import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Zap, Users, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader variant="home" />

      {/* 히어로 — 망고 살색 그라데이션 배경 */}
      <section className="px-5 py-16 md:py-24 mango-gradient-soft">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-6 text-xs font-bold text-[var(--brand-dark)] bg-[var(--brand-yellow)] rounded-full shadow-sm">
            <span>🥭</span> 모든 운동을 위한 30초 매칭
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[var(--brand-dark)] leading-tight">
            <span className="text-[var(--brand-primary)]">망설이지 말고,</span><br />
            오늘 같이 운동해요
          </h1>
          <p className="mt-6 text-base md:text-lg text-[var(--brand-dark)]/70 leading-relaxed">
            배드민턴 · 테니스 · 풋살 · 러닝 · 헬스 · 골프...<br />
            위치 · 시간 · 실력으로 동네 운동 친구를 30초 안에.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/matches"
              className="px-8 py-4 text-base font-bold rounded-full mango-gradient text-white hover:brightness-95 transition-all shadow-lg shadow-[var(--brand-primary)]/40"
            >
              지금 매치 찾기
            </Link>
            <Link
              href="/matches/new"
              className="px-8 py-4 text-base font-bold rounded-full bg-white text-[var(--brand-dark)] border-2 border-[var(--brand-dark)]/20 hover:border-[var(--brand-dark)] transition-all"
            >
              매치 모집하기
            </Link>
          </div>
        </div>
      </section>

      {/* 핵심 가치 3개 */}
      <section className="px-5 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center text-[var(--brand-dark)] mb-3">
            왜 망고인가요?
          </h2>
          <p className="text-center text-[var(--muted-foreground)] text-sm md:text-base mb-12">
            망(설이지)고(만) 행동하는 사람들을 위한 운동 플랫폼
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="w-7 h-7" />}
              title="30초 즉석 매칭"
              description="위치·시간·실력으로 필터. 마음에 들면 바로 신청, 호스트 승인은 카톡 알림으로."
              tone="primary"
            />
            <FeatureCard
              icon={<Users className="w-7 h-7" />}
              title="실력 자동 보정"
              description="자가 신고 실력 + 운동 후 상호 평가로 Elo 점수 자동 업데이트. 매번 비슷한 수준의 친구."
              tone="accent"
            />
            <FeatureCard
              icon={<Sparkles className="w-7 h-7" />}
              title="모든 운동 한 곳에"
              description="배드민턴부터 러닝까지. 종목별 따로 깔지 말고 망고 하나로 끝."
              tone="dark"
            />
          </div>
        </div>
      </section>

      {/* 이용 흐름 */}
      <section className="px-5 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center text-[var(--brand-dark)] mb-12">
            이렇게 사용해요
          </h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: '카카오로 1초 로그인', desc: '닉네임과 지역, 좋아하는 운동·실력만 입력' },
              { step: '2', title: '매치 찾거나 만들기', desc: '종목·시간·장소·실력에 맞는 매치 신청 또는 직접 모집' },
              { step: '3', title: '약속 장소에서 만나요', desc: '인원 충족되면 호스트가 확정, 자동 카톡 알림' },
              { step: '4', title: '운동 후 상호 평가', desc: '실력·매너 평가. 다음 매칭이 더 정확해져요' },
            ].map((s) => (
              <li
                key={s.step}
                className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[var(--border)]"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full mango-gradient text-white font-black shadow-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--brand-dark)]">{s.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 bg-[var(--brand-dark)] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black">
            지금 송도 · 인천 베타 테스트 중
          </h2>
          <p className="mt-4 text-white/80">
            먼저 가입하고 첫 매치 무료로 만들어보세요
          </p>
          <Link
            href="/login"
            className="inline-flex mt-8 px-10 py-4 text-base font-bold rounded-full mango-gradient text-white hover:brightness-105 transition-all shadow-xl shadow-[var(--brand-primary)]/30"
          >
            카카오로 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="px-5 py-8 bg-white border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <Image
              src="/mango-logo.png"
              alt="망고"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="font-bold text-[var(--brand-dark)]">망고 Mango</span>
            <span>· 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              인천 송도 베타
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const toneClasses = {
  primary: 'bg-[var(--brand-primary)]',
  accent: 'bg-[var(--brand-accent)]',
  dark: 'bg-[var(--brand-dark)]',
} as const

function FeatureCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode
  title: string
  description: string
  tone: keyof typeof toneClasses
}) {
  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--brand-bg-warm)]/40 hover:shadow-lg transition-shadow">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-white mb-4 ${toneClasses[tone]}`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-lg text-[var(--brand-dark)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
        {description}
      </p>
    </div>
  )
}
