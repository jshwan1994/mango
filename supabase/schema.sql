-- 콕업(KokUp) Phase 1 — 즉석 매칭 MVP 스키마
-- 작성일: 2026-06-09
-- 대상 DB: Supabase (PostgreSQL 15+)
--
-- 핵심 컨셉:
--   "오늘 저녁 7시 송도, 빈자리 1명!" 30초 즉석 매칭
--   1) 호스트가 매치 모집 글 작성
--   2) 신청자가 참여 신청 → 호스트 승인
--   3) 매치 종료 후 상호 평가 → Elo 자동 보정
--
-- 한국 동호인 문화 반영:
--   - 급수: 초심 / D / C / B / A / 자강 (6단계, 협회 표준)
--   - 위치: 시·구 단위 + 위경도 (체육관 정확도)
--   - 인원: 단식 2명 / 복식 4명 / 혼복 4명 / 게임데이 6~8명

-- =========================================
-- ENUM TYPES
-- =========================================

create type skill_grade as enum (
  'beginner',     -- 초심/왕초보
  'd',            -- D조 (초중급)
  'c',            -- C조 (중급)
  'b',            -- B조 (상급, 지역 입상권)
  'a',            -- A조 (최상급, 전국 입상권)
  'jagang'        -- 자강조 (A+)
);

create type match_type as enum (
  'singles',      -- 단식
  'doubles',      -- 복식
  'mixed',        -- 혼복
  'game_day'      -- 게임데이 (자유 페어)
);

create type match_status as enum (
  'open',         -- 모집중
  'full',         -- 정원 충족, 시작 대기
  'in_progress',  -- 진행 중
  'completed',    -- 완료 (평가 단계)
  'cancelled'     -- 취소
);

create type participant_status as enum (
  'pending',      -- 신청 대기
  'approved',     -- 호스트 승인
  'rejected',     -- 거절
  'attended',     -- 출석 완료
  'no_show'       -- 노쇼
);

-- =========================================
-- 1. profiles — 사용자 프로필 (auth.users 확장)
-- =========================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 20),
  avatar_url text,
  bio text check (char_length(bio) <= 200),

  -- 위치 (시·구 단위)
  region_sido text,             -- 예: '인천광역시'
  region_sigungu text,          -- 예: '미추홀구'
  home_court_id uuid,           -- 자주 가는 체육관 (courts 참조, 나중에 FK 추가)

  -- 실력 정보
  self_grade skill_grade not null default 'beginner',  -- 자가 신고 급수
  elo_rating integer not null default 1200,            -- AI 자동 보정 점수 (Elo)
  matches_played integer not null default 0,
  matches_won integer not null default 0,

  -- 메타
  is_phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_region on profiles(region_sido, region_sigungu);
create index idx_profiles_elo on profiles(elo_rating);

-- =========================================
-- 2. courts — 체육관/코트 마스터
-- =========================================
create table courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- 예: '송도국제도서관 체육관'
  address text not null,
  region_sido text not null,
  region_sigungu text not null,
  latitude double precision,
  longitude double precision,
  court_count integer,                      -- 코트 수
  phone text,
  hourly_fee_min integer,                   -- 시간당 대관료 (원)
  hourly_fee_max integer,
  parking_available boolean,
  shower_available boolean,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_courts_region on courts(region_sido, region_sigungu);
create index idx_courts_location on courts(latitude, longitude);

-- profiles.home_court_id FK 연결
alter table profiles
  add constraint fk_profiles_home_court
  foreign key (home_court_id) references courts(id) on delete set null;

-- =========================================
-- 3. matches — 매치 모집 글
-- =========================================
create table matches (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles(id) on delete cascade,
  court_id uuid references courts(id) on delete set null,

  title text not null check (char_length(title) between 4 and 50),
  description text check (char_length(description) <= 500),
  match_type match_type not null,

  -- 시간/장소
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 30 and 240),
  custom_location text,                     -- court_id 없을 때 자유 입력

  -- 인원/실력 조건
  max_participants integer not null check (max_participants between 2 and 12),
  current_participants integer not null default 1,  -- 호스트 포함
  grade_min skill_grade not null default 'beginner',
  grade_max skill_grade not null default 'jagang',

  -- 비용
  cost_per_person integer not null default 0,  -- 1인당 비용 (원)

  -- 상태
  status match_status not null default 'open',
  cancelled_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_grade_range check (grade_min <= grade_max)
);

create index idx_matches_status_time on matches(status, scheduled_at);
create index idx_matches_host on matches(host_id);
create index idx_matches_court on matches(court_id);

-- =========================================
-- 4. match_participants — 매치 참가자
-- =========================================
create table match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status participant_status not null default 'pending',
  message text check (char_length(message) <= 200),  -- 신청 메시지
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (match_id, user_id)
);

create index idx_participants_match on match_participants(match_id, status);
create index idx_participants_user on match_participants(user_id);

-- =========================================
-- 5. match_reviews — 매치 후 상호 평가
-- =========================================
create table match_reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,

  -- 평가 항목
  skill_rating integer not null check (skill_rating between 1 and 5),  -- 실력
  manner_rating integer not null check (manner_rating between 1 and 5),  -- 매너
  estimated_grade skill_grade,                                          -- 추정 급수
  comment text check (char_length(comment) <= 300),

  -- 태그 (배열)
  tags text[] default '{}',  -- 예: ['시간엄수', '실력좋음', '매너좋음']

  created_at timestamptz not null default now(),

  unique (match_id, reviewer_id, reviewee_id),
  constraint chk_no_self_review check (reviewer_id != reviewee_id)
);

create index idx_reviews_reviewee on match_reviews(reviewee_id);

-- =========================================
-- 6. user_skill_history — Elo 변동 기록
-- =========================================
create table user_skill_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  match_id uuid references matches(id) on delete set null,
  elo_before integer not null,
  elo_after integer not null,
  elo_change integer generated always as (elo_after - elo_before) stored,
  reason text,  -- 예: 'match_win', 'match_loss', 'review_adjustment'
  created_at timestamptz not null default now()
);

create index idx_skill_history_user on user_skill_history(user_id, created_at desc);

-- =========================================
-- 7. notifications — 알림 큐 (카카오 알림톡/푸시)
-- =========================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,  -- 예: 'match_approved', 'match_reminder', 'new_review'
  title text not null,
  body text not null,
  link_url text,
  is_read boolean not null default false,
  sent_at timestamptz,  -- 외부 채널 발송 시각 (카카오/푸시)
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on notifications(user_id, is_read, created_at desc);

-- =========================================
-- TRIGGERS — updated_at 자동 갱신
-- =========================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create trigger trg_matches_updated before update on matches
  for each row execute function set_updated_at();

create trigger trg_participants_updated before update on match_participants
  for each row execute function set_updated_at();

-- =========================================
-- RLS (Row Level Security)
-- =========================================
alter table profiles enable row level security;
alter table matches enable row level security;
alter table match_participants enable row level security;
alter table match_reviews enable row level security;
alter table user_skill_history enable row level security;
alter table notifications enable row level security;
alter table courts enable row level security;

-- profiles: 모두 읽기 가능, 본인만 수정
create policy "profiles_read_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- matches: 모두 읽기 가능, 호스트만 수정/삭제, 인증유저 작성
create policy "matches_read_all" on matches for select using (true);
create policy "matches_insert_auth" on matches for insert with check (auth.uid() = host_id);
create policy "matches_update_host" on matches for update using (auth.uid() = host_id);
create policy "matches_delete_host" on matches for delete using (auth.uid() = host_id);

-- match_participants: 모두 읽기, 본인 신청만 작성, 본인+호스트 수정
create policy "participants_read_all" on match_participants for select using (true);
create policy "participants_insert_own" on match_participants for insert with check (auth.uid() = user_id);
create policy "participants_update_self_or_host" on match_participants for update using (
  auth.uid() = user_id
  or auth.uid() = (select host_id from matches where id = match_id)
);

-- match_reviews: 매치 참가자만 작성 가능, 모두 읽기
create policy "reviews_read_all" on match_reviews for select using (true);
create policy "reviews_insert_participant" on match_reviews for insert with check (
  auth.uid() = reviewer_id
  and exists (
    select 1 from match_participants
    where match_id = match_reviews.match_id
      and user_id = auth.uid()
      and status = 'attended'
  )
);

-- user_skill_history: 본인만 조회
create policy "skill_history_read_own" on user_skill_history for select using (auth.uid() = user_id);

-- notifications: 본인만 조회/수정
create policy "notifications_read_own" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on notifications for update using (auth.uid() = user_id);

-- courts: 모두 읽기 (마스터 데이터)
create policy "courts_read_all" on courts for select using (true);

-- =========================================
-- SEED DATA — 인천 주요 체육관 (송도 베타 테스트용)
-- =========================================
insert into courts (name, address, region_sido, region_sigungu, latitude, longitude, court_count, parking_available, shower_available) values
  ('송도국제도서관 체육관', '인천 연수구 송도동 7-50', '인천광역시', '연수구', 37.3892, 126.6432, 6, true, true),
  ('인천대학교 체육관', '인천 연수구 아카데미로 119', '인천광역시', '연수구', 37.3756, 126.6336, 8, true, true),
  ('미추홀 종합문화체육관', '인천 미추홀구 학익동 590', '인천광역시', '미추홀구', 37.4239, 126.6713, 4, true, true),
  ('남동체육관', '인천 남동구 만수동 870-1', '인천광역시', '남동구', 37.4485, 126.7325, 6, true, true);
