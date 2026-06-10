// 망고 — Supabase Database 타입 (Phase 1 수동 정의)
//
// Supabase v2/v3 자동 생성과 동일한 구조. 실제 운영 시:
//   npx supabase gen types typescript --project-id <REF> > types/database.ts
//
// 중요: GenericTable이 요구하는 Record<string, unknown>과 호환되려면
//   interface 대신 type 사용 필요 (interface는 implicit index signature 없음)

export type SkillGrade = 'beginner' | 'd' | 'c' | 'b' | 'a' | 'jagang'
export type MatchType = 'singles' | 'doubles' | 'mixed' | 'game_day'
export type MatchMode = 'social' | 'skill' | 'court'
export type MatchStatus =
  | 'open'
  | 'full'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
export type ParticipantStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'attended'
  | 'no_show'

export type Profile = {
  id: string
  nickname: string
  avatar_url: string | null
  bio: string | null
  region_sido: string | null
  region_sigungu: string | null
  home_court_id: string | null
  self_grade: SkillGrade
  elo_rating: number
  matches_played: number
  matches_won: number
  is_phone_verified: boolean
  manner_score: number
  satisfaction_rate: number | null
  review_count: number
  created_at: string
  updated_at: string
}

export type Court = {
  id: string
  name: string
  address: string
  region_sido: string
  region_sigungu: string
  latitude: number | null
  longitude: number | null
  court_count: number | null
  phone: string | null
  hourly_fee_min: number | null
  hourly_fee_max: number | null
  parking_available: boolean | null
  shower_available: boolean | null
  notes: string | null
  image_url: string | null
  created_at: string
}

export type Match = {
  id: string
  host_id: string
  court_id: string | null
  title: string
  description: string | null
  match_type: MatchType
  match_mode: MatchMode
  scheduled_at: string
  duration_minutes: number
  custom_location: string | null
  max_participants: number
  current_participants: number
  grade_min: SkillGrade
  grade_max: SkillGrade
  cost_per_person: number
  status: MatchStatus
  cancelled_reason: string | null
  created_at: string
  updated_at: string
}

export type MatchParticipant = {
  id: string
  match_id: string
  user_id: string
  status: ParticipantStatus
  message: string | null
  created_at: string
  updated_at: string
}

// 자동 생성된 Supabase 타입처럼 nullable 컬럼과 DEFAULT 값은 Insert에서 optional
type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never
}[keyof T]

type AutoInsert<T, AutoKeys extends keyof T> = Omit<T, AutoKeys | NullableKeys<T>> &
  Partial<Pick<T, AutoKeys | NullableKeys<T>>>

type ProfileInsert = Partial<Profile> & Pick<Profile, 'id' | 'nickname'>
type CourtInsert = AutoInsert<Court, 'id' | 'created_at'>
type MatchInsert = AutoInsert<
  Match,
  'id' | 'created_at' | 'updated_at' | 'current_participants' | 'status' | 'match_mode'
>
type ParticipantInsert = AutoInsert<
  MatchParticipant,
  'id' | 'created_at' | 'updated_at' | 'status'
>

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: Partial<Profile>
        Relationships: []
      }
      courts: {
        Row: Court
        Insert: CourtInsert
        Update: Partial<Court>
        Relationships: []
      }
      matches: {
        Row: Match
        Insert: MatchInsert
        Update: Partial<Match>
        Relationships: []
      }
      match_participants: {
        Row: MatchParticipant
        Insert: ParticipantInsert
        Update: Partial<MatchParticipant>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}
