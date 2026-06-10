-- 망고 마이그레이션 002: 체육관 이미지 + 매치 모드 (스매시 벤치마킹)
-- 작성일: 2026-06-10
-- 적용: Supabase Dashboard > SQL Editor에서 실행
--
-- 변경사항:
--   1) courts.image_url: 체육관 대표 사진 (매치 카드/상세에서 시각적 매력)
--   2) matches.match_mode: 매칭 모드 (social/skill/court)
--   3) profiles.manner_score: 매너 점수 (스매시의 매너 시스템)
--   4) profiles.satisfaction_rate: 호스트 만족도 % (참가자 평가 평균)
--   5) profiles.review_count: 받은 후기 수
--   6) 시드 체육관 4개 image_url 업데이트

-- 1. ENUM 신규
create type match_mode as enum (
  'social',   -- 친목 매칭 (게임데이, 자유 페어)
  'skill',    -- 급수 매칭 (실력 기반)
  'court'     -- 체육관 직접 예약 (Phase 2~3)
);

-- 2. courts 테이블에 이미지 URL
alter table courts add column if not exists image_url text;

-- 3. matches 테이블에 매칭 모드
alter table matches add column if not exists match_mode match_mode not null default 'social';
create index if not exists idx_matches_mode_status on matches(match_mode, status, scheduled_at);

-- 4. profiles 테이블에 호스트 신뢰도 컬럼들
alter table profiles add column if not exists manner_score integer not null default 100 check (manner_score between 0 and 100);
alter table profiles add column if not exists satisfaction_rate integer check (satisfaction_rate between 0 and 100);
alter table profiles add column if not exists review_count integer not null default 0;

-- 5. 인천 4개 체육관 이미지 URL 시드 (placehold.co 망고 컬러 placeholder, 추후 실사진 교체)
update courts set image_url = 'https://placehold.co/600x400/FF8C42/ffffff?text=%EC%86%A1%EB%8F%84%EA%B5%AD%EC%A0%9C%EB%8F%84%EC%84%9C%EA%B4%80'
  where name = '송도국제도서관 체육관';
update courts set image_url = 'https://placehold.co/600x400/FFC857/3D2817?text=%EC%9D%B8%EC%B2%9C%EB%8C%80%ED%95%99%EA%B5%90'
  where name = '인천대학교 체육관';
update courts set image_url = 'https://placehold.co/600x400/6B9B5C/ffffff?text=%EB%AF%B8%EC%B6%94%ED%99%80%EC%B2%B4%EC%9C%A1%EA%B4%80'
  where name = '미추홀 종합문화체육관';
update courts set image_url = 'https://placehold.co/600x400/3D2817/FFC857?text=%EB%82%A8%EB%8F%99%EC%B2%B4%EC%9C%A1%EA%B4%80'
  where name = '남동체육관';
