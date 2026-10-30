/*
# Add per-weekday court booking schedule to settings

1. Modified Table
- `settings`
  - `court_open_weekday_schedules` jsonb (nullable) — 요일별 코트 예약 오픈 설정.
    Array of 7 items (0=일 ... 6=토), each `{ enabled: boolean, startHour: number, endHour: number }`.
    Null means "not configured yet"; the app falls back to all days open 05:00-24:00.

2. Security
- No policy or grant changes. Existing settings access is unchanged.

3. Notes
- Additive only: no existing columns or data are modified or removed.
*/

ALTER TABLE settings ADD COLUMN IF NOT EXISTS court_open_weekday_schedules jsonb;
