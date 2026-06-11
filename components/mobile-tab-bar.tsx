'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Users, Trophy, ShoppingBag, User } from 'lucide-react'

// 배프 + 스매시 융합 5탭
const TABS = [
  { href: '/matches', label: '매칭', Icon: Zap },
  { href: '/clubs', label: '모임', Icon: Users },
  { href: '/tournaments', label: '대회', Icon: Trophy },
  { href: '/shop', label: '망고샵', Icon: ShoppingBag },
  { href: '/profile', label: '내 정보', Icon: User },
]

const HIDDEN_PATHS = ['/', '/login', '/profile/setup', '/auth']

export function MobileTabBar() {
  const pathname = usePathname()

  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return null
  }
  // 모집/생성/상세 페이지는 풀스크린
  if (
    pathname.startsWith('/matches/new') ||
    pathname.startsWith('/clubs/new') ||
    pathname.startsWith('/tournaments/new') ||
    pathname.match(/^\/matches\/[^/]+/) ||
    pathname.match(/^\/clubs\/[^/]+/) ||
    pathname.match(/^\/tournaments\/[^/]+/)
  ) {
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
            pathname === href || pathname.startsWith(`${href}?`) || pathname.startsWith(`${href}/`)
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
