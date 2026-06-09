'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMatch } from '@/app/actions/match'
import type { Court } from '@/types/database'

type CourtOption = Pick<Court, 'id' | 'name' | 'region_sigungu'>

const gradeOptions = [
  { value: 'beginner', label: '초심' },
  { value: 'd', label: 'D조' },
  { value: 'c', label: 'C조' },
  { value: 'b', label: 'B조' },
  { value: 'a', label: 'A조' },
  { value: 'jagang', label: '자강' },
] as const

const typeOptions = [
  { value: 'singles', label: '단식', minP: 2 },
  { value: 'doubles', label: '복식', minP: 4 },
  { value: 'mixed', label: '혼복', minP: 4 },
  { value: 'game_day', label: '게임데이', minP: 4 },
] as const

export function MatchForm({ courts }: { courts: CourtOption[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [topError, setTopError] = useState<string | null>(null)
  const [useCustomLocation, setUseCustomLocation] = useState(courts.length === 0)

  function onSubmit(formData: FormData) {
    setErrors({})
    setTopError(null)

    const payload = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      match_type: String(formData.get('match_type') ?? 'doubles'),
      scheduled_at: String(formData.get('scheduled_at') ?? ''),
      duration_minutes: Number(formData.get('duration_minutes') ?? 60),
      court_id: useCustomLocation ? null : String(formData.get('court_id') ?? '') || null,
      custom_location: useCustomLocation
        ? String(formData.get('custom_location') ?? '') || null
        : null,
      max_participants: Number(formData.get('max_participants') ?? 4),
      grade_min: String(formData.get('grade_min') ?? 'beginner'),
      grade_max: String(formData.get('grade_max') ?? 'jagang'),
      cost_per_person: Number(formData.get('cost_per_person') ?? 0),
    }

    startTransition(async () => {
      const result = await createMatch(payload)
      if (!result.ok) {
        setTopError(result.error)
        if (result.fieldErrors) {
          const flat: Record<string, string> = {}
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            if (v?.[0]) flat[k] = v[0]
          }
          setErrors(flat)
        }
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {topError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {topError}
        </div>
      )}

      <Field label="제목" error={errors.title} required>
        <input
          name="title"
          type="text"
          placeholder="예: 송도 토요일 오후 7시 혼복 빈자리 1명"
          maxLength={50}
          required
          className="input"
        />
      </Field>

      <Field label="매치 종류" error={errors.match_type} required>
        <select name="match_type" defaultValue="doubles" className="input">
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="시작 시간" error={errors.scheduled_at} required>
          <input
            name="scheduled_at"
            type="datetime-local"
            required
            min={new Date(Date.now() + 30 * 60_000).toISOString().slice(0, 16)}
            className="input"
          />
        </Field>
        <Field label="진행 시간" error={errors.duration_minutes}>
          <select name="duration_minutes" defaultValue={60} className="input">
            <option value={60}>1시간</option>
            <option value={90}>1시간 30분</option>
            <option value={120}>2시간</option>
            <option value={180}>3시간</option>
            <option value={240}>4시간</option>
          </select>
        </Field>
      </div>

      <Field label="장소" error={errors.custom_location} required>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setUseCustomLocation(false)}
            className={tabBtn(!useCustomLocation)}
            disabled={courts.length === 0}
          >
            등록된 체육관
          </button>
          <button
            type="button"
            onClick={() => setUseCustomLocation(true)}
            className={tabBtn(useCustomLocation)}
          >
            직접 입력
          </button>
        </div>
        {useCustomLocation ? (
          <input
            name="custom_location"
            type="text"
            placeholder="예: 인천대학교 풋살장 옆 배드민턴 코트"
            maxLength={200}
            className="input"
          />
        ) : (
          <select name="court_id" className="input">
            <option value="">-- 선택 --</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.region_sigungu}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="총 인원" error={errors.max_participants} required>
          <input
            name="max_participants"
            type="number"
            min={2}
            max={12}
            defaultValue={4}
            required
            className="input"
          />
        </Field>
        <Field label="실력 (최소)" error={errors.grade_min} required>
          <select name="grade_min" defaultValue="beginner" className="input">
            {gradeOptions.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </Field>
        <Field label="실력 (최대)" error={errors.grade_max} required>
          <select name="grade_max" defaultValue="jagang" className="input">
            {gradeOptions.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="1인당 비용 (원)" error={errors.cost_per_person}>
        <input
          name="cost_per_person"
          type="number"
          min={0}
          max={100000}
          step={1000}
          defaultValue={0}
          className="input"
        />
      </Field>

      <Field label="추가 설명" error={errors.description}>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          placeholder="셔틀콕 가져오기, 주차 안내, 매너 등"
          className="input resize-none"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-2xl bg-[var(--brand-primary)] text-white font-bold text-base hover:bg-[var(--brand-primary-hover)] transition disabled:opacity-50"
      >
        {pending ? '등록 중...' : '매치 등록하기'}
      </button>
    </form>
  )
}

function tabBtn(active: boolean) {
  return `flex-1 h-10 rounded-xl text-sm font-medium transition ${
    active
      ? 'bg-[var(--brand-dark)] text-white'
      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--brand-bg-warm)]'
  }`
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-[var(--brand-dark)] mb-1.5">
        {label}
        {required && <span className="text-[var(--brand-primary)] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
