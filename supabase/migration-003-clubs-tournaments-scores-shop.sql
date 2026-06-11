-- 망고 마이그레이션 003: 배프 패턴 도입 (모임/대회/스코어/샵 + 협회코드 + UGC)
-- 작성일: 2026-06-10
--
-- 추가 테이블:
--   1) clubs — 동호회 (상시 가입)
--   2) club_members — 동호회 회원 (역할: 회장/총무/회원)
--   3) tournaments — 대회 (자체 등록 + 외부 UGC)
--   4) match_scores — 매치 점수 기록 (임시 스코어 보드)
--   5) products — 샵 상품 (쿠팡 파트너스 링크)
--   6) banners — 홈 상단 광고/공지 배너
--
-- 확장 컬럼:
--   profiles.association_code (#KR5 같은 협회/식별 코드)
--   profiles.club_id (대표 소속 동호회, FK)

-- ENUM
create type tournament_source as enum ('mango', 'external');
create type tournament_status as enum ('upcoming', 'open', 'closed', 'finished');
create type club_role as enum ('owner', 'manager', 'member');
create type product_category as enum ('racket', 'shuttlecock', 'shoes', 'apparel', 'bag', 'other');

-- =========================================
-- 1) clubs — 동호회
-- =========================================
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 30),
  description text check (char_length(description) <= 500),
  image_url text,
  region_sido text not null,
  region_sigungu text not null,
  home_court_id uuid references courts(id) on delete set null,
  owner_id uuid not null references profiles(id) on delete cascade,
  member_count integer not null default 1,
  grade_min skill_grade not null default 'beginner',
  grade_max skill_grade not null default 'jagang',
  monthly_fee integer not null default 0,         -- 월회비
  meeting_schedule text,                          -- 정기 운동 일정 (예: '매주 토 18-21시')
  is_recruiting boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clubs_region on clubs(region_sido, region_sigungu);
create index if not exists idx_clubs_recruiting on clubs(is_recruiting, created_at desc);

-- =========================================
-- 2) club_members — 동호회 회원
-- =========================================
create table if not exists club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role club_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)
);
create index if not exists idx_club_members_user on club_members(user_id);

-- =========================================
-- 3) tournaments — 대회 (자체 + 외부 UGC)
-- =========================================
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 100),
  poster_url text,
  source tournament_source not null default 'external',
  organizer text,                                 -- 주최 (협회/클럽명)
  region_sido text,
  region_sigungu text,
  venue_name text,                                -- 경기장
  starts_on date not null,
  ends_on date,
  registration_url text,                          -- 외부: 공식 사이트 / 자체: 빈값
  prize text,                                     -- 시상 (예: '우승 50만원')
  fee integer,                                    -- 참가비
  bracket_url text,                               -- 대진표 URL
  status tournament_status not null default 'upcoming',
  posted_by uuid references profiles(id) on delete set null,  -- UGC: 제보자
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tournaments_starts on tournaments(starts_on desc);
create index if not exists idx_tournaments_status on tournaments(status, starts_on);

-- =========================================
-- 4) match_scores — 매치 점수 기록 (임시 스코어 보드)
-- =========================================
create table if not exists match_scores (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  recorded_by uuid not null references profiles(id) on delete cascade,
  set_number integer not null default 1 check (set_number between 1 and 5),
  team_a_label text,                              -- '청팀' / 'A팀' 등
  team_b_label text,                              -- '백팀' / 'B팀' 등
  team_a_score integer not null default 0 check (team_a_score >= 0),
  team_b_score integer not null default 0 check (team_b_score >= 0),
  winner_team text,                               -- 'a' / 'b' / null
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_match_scores_match on match_scores(match_id, set_number);

-- =========================================
-- 5) products — 샵 (쿠팡 파트너스 링크)
-- =========================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category product_category not null,
  brand text,
  name text not null,
  image_url text,
  price integer,                                  -- 표시 가격 (참고용)
  original_price integer,                         -- 정가 (할인 표시용)
  partner_url text not null,                      -- 쿠팡 파트너스 링크
  rating_avg numeric(2, 1),                       -- 별점 (4.5)
  rating_count integer not null default 0,
  description text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_products_category on products(category, sort_order);
create index if not exists idx_products_featured on products(is_featured, sort_order);

-- =========================================
-- 6) banners — 홈 상단 광고/공지 캐러셀
-- =========================================
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_banners_active on banners(is_active, sort_order);

-- =========================================
-- profiles 확장 (협회 코드 + 대표 소속 동호회)
-- =========================================
alter table profiles add column if not exists association_code text;
alter table profiles add column if not exists primary_club_id uuid references clubs(id) on delete set null;

-- =========================================
-- TRIGGERS — updated_at 자동
-- =========================================
create trigger trg_clubs_updated before update on clubs
  for each row execute function set_updated_at();
create trigger trg_tournaments_updated before update on tournaments
  for each row execute function set_updated_at();
create trigger trg_match_scores_updated before update on match_scores
  for each row execute function set_updated_at();

-- =========================================
-- RLS
-- =========================================
alter table clubs enable row level security;
alter table club_members enable row level security;
alter table tournaments enable row level security;
alter table match_scores enable row level security;
alter table products enable row level security;
alter table banners enable row level security;

-- clubs: 모두 읽기, 인증 작성, 회장만 수정/삭제
create policy "clubs_read_all" on clubs for select using (true);
create policy "clubs_insert_auth" on clubs for insert with check (auth.uid() = owner_id);
create policy "clubs_update_owner" on clubs for update using (auth.uid() = owner_id);
create policy "clubs_delete_owner" on clubs for delete using (auth.uid() = owner_id);

-- club_members: 모두 읽기, 본인 신청, 회장/본인 삭제
create policy "club_members_read_all" on club_members for select using (true);
create policy "club_members_insert_own" on club_members for insert with check (auth.uid() = user_id);
create policy "club_members_delete_self_or_owner" on club_members for delete using (
  auth.uid() = user_id
  or auth.uid() = (select owner_id from clubs where id = club_id)
);

-- tournaments: 모두 읽기, 인증 작성, 제보자만 수정
create policy "tournaments_read_all" on tournaments for select using (true);
create policy "tournaments_insert_auth" on tournaments for insert with check (auth.uid() = posted_by);
create policy "tournaments_update_poster" on tournaments for update using (auth.uid() = posted_by);

-- match_scores: 매치 참가자만 읽기/작성
create policy "match_scores_read_participants" on match_scores for select using (
  exists (
    select 1 from match_participants
    where match_id = match_scores.match_id and user_id = auth.uid()
  )
);
create policy "match_scores_insert_participants" on match_scores for insert with check (
  auth.uid() = recorded_by
  and exists (
    select 1 from match_participants
    where match_id = match_scores.match_id and user_id = auth.uid()
  )
);
create policy "match_scores_update_recorder" on match_scores for update using (auth.uid() = recorded_by);

-- products: 모두 읽기 (마스터)
create policy "products_read_all" on products for select using (true);

-- banners: 모두 읽기 (활성화된 것만 앱에서 필터)
create policy "banners_read_all" on banners for select using (true);

-- =========================================
-- 시드 데이터 — 망고 샵 (쿠팡 파트너스 링크는 예시, 곤이 실제 링크로 교체)
-- =========================================
insert into products (category, brand, name, image_url, price, original_price, partner_url, rating_avg, rating_count, description, is_featured, sort_order) values
  ('racket', 'YONEX', '아스트록스 99 PRO', 'https://placehold.co/400x400/FF8C42/ffffff?text=ASTROX+99', 290000, 320000, 'https://link.coupang.com/a/example1', 4.8, 1234, '공격형 라켓 베스트셀러', true, 1),
  ('racket', 'VICTOR', '오라셔 90F', 'https://placehold.co/400x400/FFC857/3D2817?text=AURASPEED+90F', 240000, 270000, 'https://link.coupang.com/a/example2', 4.7, 856, '컨트롤+스피드 균형', true, 2),
  ('shuttlecock', 'YONEX', '에어로센서 50 (12개입)', 'https://placehold.co/400x400/6B9B5C/ffffff?text=AS-50', 38000, 45000, 'https://link.coupang.com/a/example3', 4.9, 3245, '연습용 베스트', true, 3),
  ('shuttlecock', 'VICTOR', '챔피언 No.1 (12개입)', 'https://placehold.co/400x400/3D2817/FFC857?text=Champion', 42000, 50000, 'https://link.coupang.com/a/example4', 4.6, 1287, '대회용 셔틀콕', false, 4),
  ('shoes', 'YONEX', '파워쿠션 에어러스Z2', 'https://placehold.co/400x400/FF8C42/ffffff?text=AERUS+Z2', 165000, 195000, 'https://link.coupang.com/a/example5', 4.7, 654, '가볍고 그립 좋음', true, 5);

-- 시드 데이터 — 망고 배너 (실제 운영 시 교체)
insert into banners (title, image_url, link_url, sort_order, is_active) values
  ('🥭 망고 베타 출시 — 인천 송도부터', 'https://placehold.co/1200x400/FF8C42/ffffff?text=Mango+Beta', '/matches', 1, true),
  ('첫 매치 모집하고 망고 굿즈 받기', 'https://placehold.co/1200x400/FFC857/3D2817?text=First+Match+Reward', '/matches/new', 2, true),
  ('쿠팡 파트너스 라켓 베스트', 'https://placehold.co/1200x400/6B9B5C/ffffff?text=Best+Rackets', '/shop', 3, true);
