'use client'

import { useEffect, useState } from 'react'

// 스매시 패턴: "14시간 22분 뒤 경기 시작!" 하단 고정 표시
export function Countdown({ targetIso }: { targetIso: string }) {
  const [text, setText] = useState(() => formatRemaining(targetIso))

  useEffect(() => {
    const tick = () => setText(formatRemaining(targetIso))
    tick()
    const id = setInterval(tick, 30_000) // 30초마다 갱신
    return () => clearInterval(id)
  }, [targetIso])

  return <span>{text}</span>
}

function formatRemaining(targetIso: string): string {
  const diffMs = new Date(targetIso).getTime() - Date.now()
  if (diffMs <= 0) return '경기 시간이 지났어요'

  const totalMin = Math.floor(diffMs / 60_000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const minutes = totalMin % 60

  if (days > 0) return `${days}일 ${hours}시간 뒤 경기 시작!`
  if (hours > 0) return `${hours}시간 ${minutes}분 뒤 경기 시작!`
  return `${minutes}분 뒤 경기 시작!`
}
