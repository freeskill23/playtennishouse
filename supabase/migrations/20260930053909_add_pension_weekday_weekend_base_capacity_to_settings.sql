/*
# Add pension weekday/weekend base capacity to settings

1. Purpose
   - 관리자가 평일용 기준인원과 주말용 기준인원을 각각 설정할 수 있도록 settings 테이블에 컬럼을 추가합니다.
   - 기본값은 평일 4명, 주말 4명입니다.

2. Changes
   - `settings` 테이블에 `pension_weekday_base_capacity` integer 컬럼 추가 (기본값 4)
   - `settings` 테이블에 `pension_weekend_base_capacity` integer 컬럼 추가 (기본값 4)

3. Notes
   - 기존 데이터 손실 없음 (새 컬럼 추가만)
   - RLS 변경 없음
*/

ALTER TABLE settings ADD COLUMN IF NOT EXISTS pension_weekday_base_capacity integer DEFAULT 4;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pension_weekend_base_capacity integer DEFAULT 4;
