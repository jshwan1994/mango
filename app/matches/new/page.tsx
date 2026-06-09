import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { MatchForm } from '@/components/match-form'
import type { Court } from '@/types/database'

export default async function NewMatchPage() {
  let courts: Pick<Court, 'id' | 'name' | 'region_sigungu'>[] = []
  let hasAuth = false

  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) redirect('/login?next=/matches/new')
    hasAuth = true

    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (!prof) redirect('/profile/setup')

    const { data: c } = await supabase
      .from('courts')
      .select('id, name, region_sigungu')
      .order('region_sigungu', { ascending: true })

    courts = c ?? []
  } catch {
    // .env.local 없을 때 안내 표시
  }

  if (!hasAuth) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-5">
          <SetupNotice />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="max-w-2xl w-full mx-auto px-5 py-8 flex-1">
        <h1 className="text-2xl font-black text-[var(--brand-dark)]">매치 모집</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          시간 · 장소 · 실력 조건을 명확히 적을수록 매칭이 빨라요
        </p>
        <div className="mt-6">
          <MatchForm courts={courts} />
        </div>
      </main>
    </div>
  )
}

function SetupNotice() {
  return (
    <div className="max-w-md p-6 bg-white rounded-2xl border border-[var(--border)] text-center">
      <p className="text-2xl mb-3">⚙️</p>
      <h2 className="font-black text-[var(--brand-dark)]">Supabase 연결 필요</h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
        매치 모집 기능은 데이터베이스 연결 후 사용 가능합니다.<br />
        <code className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">.env.local</code> 파일에 Supabase URL/Key를 설정해주세요.
      </p>
    </div>
  )
}
