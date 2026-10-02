/*
# Add BBQ Package settings and gallery filter

## Changes

1. New columns on `settings` table for BBQ package configuration:
   - `bbq_day_start_hour` (int, default 5) — 데이타임 시작 시간
   - `bbq_night_start_hour` (int, default 17) — 나이트타임 시작 시간 (이 시간부터 조명 켜짐)
   - `bbq_base_hours` (int, default 5) — 기본 이용 시간
   - `bbq_base_capacity` (int, default 4) — 기본 인원
   - `bbq_day_price` (int, default 160000) — 데이타임 기본 가격
   - `bbq_night_price` (int, default 200000) — 나이트타임 기본 가격
   - `bbq_extra_person_fee` (int, default 30000) — 추가 인원 1인당 금액
   - `bbq_extra_hour_fee` (int, default 10000) — 시간 초과시 1인당 추가 금액
   - `bbq_open_days` (int, default 30) — 예약 오픈 기간 (일)

2. New column on `gallery_items` table:
   - `show_on_bbq` (boolean, default false) — 바베큐패키지 페이지 갤러리 표시 여부

3. Security
   - No new tables. Existing settings/gallery_items policies already allow anon CRUD.
*/

DO $$ BEGIN
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_day_start_hour int NOT NULL DEFAULT 5;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_night_start_hour int NOT NULL DEFAULT 17;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_base_hours int NOT NULL DEFAULT 5;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_base_capacity int NOT NULL DEFAULT 4;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_day_price int NOT NULL DEFAULT 160000;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_night_price int NOT NULL DEFAULT 200000;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_extra_person_fee int NOT NULL DEFAULT 30000;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_extra_hour_fee int NOT NULL DEFAULT 10000;
  ALTER TABLE settings ADD COLUMN IF NOT EXISTS bbq_open_days int NOT NULL DEFAULT 30;
END $$;

ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS show_on_bbq boolean NOT NULL DEFAULT false;
