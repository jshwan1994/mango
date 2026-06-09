// 망고 — Auth 세션 갱신 미들웨어
// middleware.ts에서 호출되어 토큰 자동 갱신

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // .env.local 미설정 시 그냥 통과 (개발 초기 단계)
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser()는 매 요청마다 토큰 검증 → 보안 핵심
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 경로 — 로그인 안 했으면 /login으로
  const protectedPaths = ['/matches/new', '/profile', '/my']
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
