'use client'

import { useMemo, useState, useTransition } from 'react'
import { setupProfile } from '@/app/actions/profile'
import type { Court } from '@/types/database'

type CourtOption = Pick<Court, 'id' | 'name' | 'region_sido' | 'region_sigungu'>

const gradeOptions = [
  { value: 'beginner', label: '초심·왕초보', desc: '이제 막 라켓 잡음' },
  { value: 'd', label: 'D조', desc: '기본기 갖춤, 동호회 D조' },
  { value: 'c', label: 'C조', desc: '중급, 지역 대회 참가' },
  { value: 'b', label: 'B조', desc: '상급, 지역 입상권' },
  { value: 'a', label: 'A조', desc: '최상급, 전국 입상권' },
  { value: 'jagang', label: '자강조', desc: '선수급' },
] as const

// 주요 시·도 (Phase 1은 수도권 위주, 추후 확장)
const sidoOptions = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
]

export function ProfileSetupForm({
  courts,
  suggestedNickname,
}: {
  courts: CourtOption[]
  suggestedNickname: string
}) {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [topError, setTopError] = useState<string | null>(null)
  const [sido, setSido] = useState('인천광역시')

  const courtsInSido = useMemo(
    () => courts.filter((c) => c.region_sido === sido),
    [courts, sido]
  )

  function onSubmit(formData: FormData) {
    setErrors({})
    setTopError(null)

    const payload = {
      nickname: String(formData.get('nickname') ?? '').trim(),
      region_sido: String(formData.get('region_sido') ?? sido),
      region_sigungu: String(formData.get('region_sigungu') ?? '').trim(),
      self_grade: String(formData.get('self_grade') ?? 'beginner'),
      home_court_id: String(formData.get('home_court_id') ?? '') || null,
      bio: String(formData.get('bio') ?? '').trim() || null,
    }

    startTransition(async () => {
      const r = await setupProfile(payload)
      if (!r.ok) {
        setTopError(r.error)
        if (r.fieldErrors) {
          const flat: Record<string, string> = {}
          for (const [k, v] of Object.entries(r.fieldErrors)) {
            if (v?.[0]) flat[k] = v[0]
          }
          setErrors(flat)
        }
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

      <Field label="닉네임" error={errors.nickname} required>
        <input
          name="nickname"
          type="text"
          defaultValue={suggestedNickname}
          placeholder="망고 안에서 표시될 이름"
          maxLength={20}
          required
          className="input"
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          2~20자, 한글·영문·숫자·_ 사용 가능
        </p>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="시·도" error={errors.region_sido} required>
          <select
            name="region_sido"
            aria-label="시·도 선택"
            value={sido}
            onChange={(e) => setSido(e.target.value)}
            className="input"
          >
            {sidoOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="시·군·구" error={errors.region_sigungu} required>
          <input
            name="region_sigungu"
            type="text"
            defaultValue="연수구"
            placeholder="예: 연수구"
            required
            className="input"
          />
        </Field>
      </div>

      {courtsInSido.length > 0 && (
        <Field label="자주 가는 체육관 (선택)" error={errors.home_court_id}>
          <select name="home_court_id" aria-label="자주 가는 체육관 선택" defaultValue="" className="input">
            <option value="">선택 안함</option>
            {courtsInSido.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.region_sigungu}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="실력 (자가 신고)" error={errors.self_grade} required>
        <div className="space-y-2">
          {gradeOptions.map((g) => (
            <label
              key={g.value}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] cursor-pointer hover:border-[var(--brand-primary)] transition has-[:checked]:border-[var(--brand-primary)] has-[:checked]:bg-[var(--brand-bg-warm)]"
            >
              <input
                type="radio"
                name="self_grade"
                value={g.value}
                defaultChecked={g.value === 'beginner'}
                required
                className="accent-[var(--brand-primary)]"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--brand-dark)]">{g.label}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{g.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
          경기 결과로 자동 보정됩니다. 너무 높게 신고하면 매칭이 어려워요.
        </p>
      </Field>

      <Field label="자기소개 (선택)" error={errors.bio}>
        <textarea
          name="bio"
          rows={2}
          maxLength={200}
          placeholder="예: 주말 위주로 활동, 복식 선호"
          className="input resize-none"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-2xl bg-[var(--brand-primary)] text-white font-bold text-base hover:bg-[var(--brand-primary-hover)] transition disabled:opacity-50"
      >
        {pending ? '저장 중...' : '시작하기'}
      </button>
    </form>
  )
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
