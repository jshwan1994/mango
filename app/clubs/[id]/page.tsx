import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Users, Calendar, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatGrade } from '@/lib/utils'
import type { Club } from '@/types/database'

export const metadata = { title: '모임 — 망고' }

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let club: Club | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .maybeSingle<Club>()
    club = data
  } catch {
    // .env.local 미설정 시
  }

  if (!club) notFound()

  const image =
    club.image_url ??
    'https://placehold.co/1200x600/FFF4E0/3D2817?text=Mango+Club'

  return (
    <div className="flex flex-col flex-1 pb-32">
      {/* 큰 사진 헤더 */}
      <div className="relative w-full aspect-[16/9] bg-[var(--muted)]">
        <Image
          src={image}
          alt={club.name}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority
        />
        <Link
          href="/clubs"
          aria-label="뒤로"
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--brand-dark)]" />
        </Link>
      </div>

      <main className="max-w-2xl w-full mx-auto px-5 flex-1 space-y-4">
        {/* 헤더 */}
        <section className="pt-5">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
              {formatGrade(club.grade_min)}~{formatGrade(club.grade_max)}
            </span>
            {club.is_recruiting && (
              <span className="px-2.5 py-1 rounded-full bg-[var(--brand-primary)] text-white font-bold">
                모집중
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-black text-[var(--brand-dark)] leading-tight">
            {club.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {club.region_sido} {club.region_sigungu}
          </p>
        </section>

        {/* 기본 정보 */}
        <section className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <h2 className="px-5 pt-5 pb-3 text-base font-black text-[var(--brand-dark)]">
            모임 정보
          </h2>
          <div className="px-5 pb-5 space-y-3 text-sm">
            <InfoRow icon={<Users className="w-4 h-4" />} label="회원 수">
              <span className="font-bold text-[var(--brand-dark)]">{club.member_count}명</span>
            </InfoRow>
            {club.meeting_schedule && (
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="정기 운동">
                {club.meeting_schedule}
              </InfoRow>
            )}
            <InfoRow icon={<Wallet className="w-4 h-4" />} label="월 회비">
              {club.monthly_fee > 0
                ? `${club.monthly_fee.toLocaleString()}원`
                : '무료'}
            </InfoRow>
          </div>
        </section>

        {/* 소개 */}
        {club.description && (
          <section className="bg-white rounded-2xl border border-[var(--border)] p-5">
            <h2 className="text-base font-black text-[var(--brand-dark)] mb-2">소개</h2>
            <p className="text-sm text-[var(--brand-dark)] whitespace-pre-wrap leading-relaxed">
              {club.description}
            </p>
          </section>
        )}
      </main>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--border)] safe-area-bottom">
        <div className="max-w-2xl mx-auto px-5 py-3">
          <button
            type="button"
            disabled
            className="w-full h-12 rounded-2xl mango-gradient text-white font-bold disabled:opacity-50"
          >
            가입 신청 (준비 중)
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 w-24 flex-shrink-0 text-[var(--muted-foreground)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 text-[var(--brand-dark)]">{children}</div>
    </div>
  )
}
