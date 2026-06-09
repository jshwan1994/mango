import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGrade(grade: string): string {
  const map: Record<string, string> = {
    beginner: '초심',
    d: 'D조',
    c: 'C조',
    b: 'B조',
    a: 'A조',
    jagang: '자강조',
  }
  return map[grade] ?? grade
}

export function formatMatchType(type: string): string {
  const map: Record<string, string> = {
    singles: '단식',
    doubles: '복식',
    mixed: '혼복',
    game_day: '게임데이',
  }
  return map[type] ?? type
}

export function formatRelativeTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date
  const diffMs = target.getTime() - Date.now()
  const diffMin = Math.round(diffMs / 60000)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  if (Math.abs(diffMin) < 60) return `${diffMin > 0 ? '' : ''}${diffMin}분 후`
  if (Math.abs(diffHour) < 24) return `${diffHour}시간 후`
  if (Math.abs(diffDay) < 7) return `${diffDay}일 후`

  return target.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
