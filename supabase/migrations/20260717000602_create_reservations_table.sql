/*
# Create reservations table

1. Purpose
   - Persist all pension and court reservations so both users and the admin
     (separate browser sessions / AppProvider instances) see the same data.
   - Previously reservations lived in React useState only, so the admin page
     could not see reservations made by a logged-in user.

2. New Tables
   - `reservations`
     - `id`            text PRIMARY KEY (client-generated, e.g. "r_abc123")
     - `type`          text NOT NULL  ('pension' | 'court')
     - `user_id`       text NOT NULL  (profiles.id / auth.users.id, or 'admin')
     - `target_id`     text NOT NULL  (room id for pension, court name for court)
     - `target_label`  text NOT NULL  (display label, e.g. 'A동', 'A코트')
     - `date`          date NOT NULL  (YYYY-MM-DD)
     - `time_slot`     text          (court only, e.g. '09:00-11:00')
     - `capacity`      integer       (pension only, number of guests)
     - `status`        text NOT NULL DEFAULT '신청'
       ('신청' | '입금대기' | '승인대기' | '예약완료' | '이용완료' | '취소')
     - `waiting_sequence` integer    (null = primary, 1+ = waiting)
     - `deposit_timeout_until` bigint (epoch ms, for waiting handoff)
     - `amount`        integer NOT NULL DEFAULT 0
     - `created_at`    bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint

3. Indexes
   - `reservations_date_idx` on (date) — dashboard filters by date
   - `reservations_user_idx` on (user_id) — my-page queries
   - `reservations_target_idx` on (type, target_id, date) — slot status lookups

4. Security
   - Enable RLS on `reservations`.
   - This is a shared booking board: both the authenticated user and the
     anon admin (who is not a real Supabase auth user) must read and write
     the same rows. Policies therefore use `TO anon, authenticated` with
     `USING (true)` / `WITH CHECK (true)` — the data is intentionally shared
     across all users of this booking application.
*/

CREATE TABLE IF NOT EXISTS reservations (
  id text PRIMARY KEY,
  type text NOT NULL,
  user_id text NOT NULL,
  target_id text NOT NULL,
  target_label text NOT NULL,
  date date NOT NULL,
  time_slot text,
  capacity integer,
  status text NOT NULL DEFAULT '신청',
  waiting_sequence integer,
  deposit_timeout_until bigint,
  amount integer NOT NULL DEFAULT 0,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations (date);
CREATE INDEX IF NOT EXISTS reservations_user_idx ON reservations (user_id);
CREATE INDEX IF NOT EXISTS reservations_target_idx ON reservations (type, target_id, date);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservations_select_all" ON reservations;
CREATE POLICY "reservations_select_all" ON reservations
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reservations_insert_all" ON reservations;
CREATE POLICY "reservations_insert_all" ON reservations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "reservations_update_all" ON reservations;
CREATE POLICY "reservations_update_all" ON reservations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "reservations_delete_all" ON reservations;
CREATE POLICY "reservations_delete_all" ON reservations
  FOR DELETE TO anon, authenticated USING (true);
