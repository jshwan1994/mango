import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { ProfileSetupForm } from '@/components/profile-setup-form'
import type { Court } from '@/types/database'

export default async function ProfileSetupPage() {
  let courts: Pick<Court, 'id' | 'name' | 'region_sido' | 'region_sigungu'>[] = []
  let suggestedNickname = ''

  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) redirect('/login?next=/profile/setup')

    // 이미 프로필 있으면 매치 페이지로
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (existing) redirect('/matches')

    suggestedNickname =
      (auth.user.user_metadata?.preferred_username as string | undefined) ??
      (auth.user.user_metadata?.full_name as string | undefined) ??
      ''

    const { data: c } = await supabase
      .from('courts')
      .select('id, name, region_sido, region_sigungu')
      .order('region_sigungu')
    courts = c ?? []
  } catch {
    // .env.local 미설정 시 안내
  }

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="max-w-md w-full mx-auto px-5 py-8 flex-1">
        <h1 className="text-2xl font-black text-[var(--brand-dark)]">
          시작하기 전에 잠깐!
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          닉네임과 지역, 실력을 알려주세요. 매칭이 훨씬 정확해져요.
        </p>
        <div className="mt-6">
          <ProfileSetupForm
            courts={courts}
            suggestedNickname={suggestedNickname}
          />
        </div>
      </main>
    </div>
  )
}
