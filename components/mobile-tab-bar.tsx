'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bell, MessageSquare, MessageCircle, User } from 'lucide-react'

const TABS = [
  { href: '/matches', label: '홈', Icon: Home },
  { href: '/alerts', label: '알림', Icon: Bell },
  { href: '/board', label: '담벼락', Icon: MessageSquare },
  { href: '/chat', label: '채팅', Icon: MessageCircle },
  { href: '/profile', label: '내 정보', Icon: User },
]

// 탭바를 숨길 경로들 (로그인/셋업/랜딩)
const HIDDEN_PATHS = ['/', '/login', '/profile/setup', '/auth']

export function MobileTabBar() {
  const pathname = usePathname()

  // 숨김 경로 또는 매치 모집/상세는 풀스크린 모드 → 탭바 숨김
  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return null
  }
  if (pathname.startsWith('/matches/new') || pathname.match(/^\/matches\/[^/]+$/)) {
    return null
  }

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[var(--border)] safe-area-bottom"
    >
      <ul className="flex max-w-5xl mx-auto">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === '/matches'
              ? pathname === '/matches' || pathname.startsWith('/matches?')
              : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 transition ${
                  active
                    ? 'text-[var(--brand-primary)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
              >
                <Icon
                  className="w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.8}
                  fill={active ? 'currentColor' : 'none'}
                  fillOpacity={active ? 0.15 : 0}
                />
                <span
                  className={`text-[11px] ${
                    active ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
