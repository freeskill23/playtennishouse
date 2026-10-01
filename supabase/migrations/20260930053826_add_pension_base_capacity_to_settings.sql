/*
# Add pension_base_capacity to settings

1. Purpose
   - 관리자가 펜션 기준인원(평일/주말 공통)을 설정할 수 있도록 settings 테이블에 컬럼을 추가합니다.
   - 기본값은 4명입니다.

2. Changes
   - `settings` 테이블에 `pension_base_capacity` integer 컬럼 추가 (기본값 4)

3. Notes
   - 기존 데이터 손실 없음 (새 컬럼 추가만)
   - RLS 변경 없음 (기존 settings 정책 그대로 적용)
*/

ALTER TABLE settings ADD COLUMN IF NOT EXISTS pension_base_capacity integer DEFAULT 4;
