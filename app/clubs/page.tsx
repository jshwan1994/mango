import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, Plus, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { formatGrade } from '@/lib/utils'
import type { Club } from '@/types/database'

export const metadata = { title: '모임 — 망고' }

async function fetchClubs(): Promise<Club[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .eq('is_recruiting', true)
      .order('member_count', { ascending: false })
      .limit(50)
    return (data ?? []) as Club[]
  } catch {
    return []
  }
}

export default async function ClubsPage() {
  const clubs = await fetchClubs()

  return (
    <div className="flex flex-col flex-1 pb-24">
      <SiteHeader />

      <div className="max-w-5xl w-full mx-auto px-5 pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[var(--brand-dark)]">모임 · 동호회</h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            우리 동네 정기 운동 동호회를 찾아보세요
          </p>
        </div>
        <Link
          href="/clubs/new"
          className="flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-full mango-gradient text-white shadow-sm hover:brightness-95 transition"
        >
          <Plus className="w-4 h-4" /> 모임 만들기
        </Link>
      </div>

      <main className="max-w-5xl w-full mx-auto px-5 py-5 flex-1">
        {clubs.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {clubs.map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🏸</div>
      <p className="font-bold text-[var(--brand-dark)]">아직 모임이 없어요</p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        첫 번째 동호회 회장이 되어보세요
      </p>
      <Link
        href="/clubs/new"
        className="inline-flex mt-6 px-6 py-3 text-sm font-bold rounded-full mango-gradient text-white"
      >
        <Plus className="w-4 h-4 mr-1" /> 모임 만들기
      </Link>
    </div>
  )
}

function ClubCard({ club }: { club: Club }) {
  const image =
    club.image_url ??
    'https://placehold.co/600x400/FFF4E0/3D2817?text=Mango+Club'
  return (
    <Link
      href={`/clubs/${club.id}`}
      className="flex bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--brand-primary)] hover:shadow-md transition-all"
    >
      <div className="relative w-28 sm:w-32 flex-shrink-0 bg-[var(--muted)]">
        <Image
          src={image}
          alt={club.name}
          fill
          sizes="(max-width: 640px) 112px, 128px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <MapPin className="w-3 h-3" />
          {club.region_sigungu}
        </div>
        <h3 className="mt-1 font-bold text-[var(--brand-dark)] truncate">
          {club.name}
        </h3>
        {club.meeting_schedule && (
          <p className="mt-1 text-xs text-[var(--brand-dark)] truncate flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {club.meeting_schedule}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-xs flex-wrap">
          <span className="inline-flex items-center gap-1 text-[var(--brand-primary)] font-bold">
            <Users className="w-3 h-3" />
            {club.member_count}명
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] font-bold">
            {formatGrade(club.grade_min)}~{formatGrade(club.grade_max)}
          </span>
          {club.monthly_fee > 0 && (
            <span className="text-[var(--muted-foreground)]">
              월 {club.monthly_fee.toLocaleString()}원
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
