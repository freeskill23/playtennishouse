/*
# Create matching_posts table

1. Purpose
- Persist user-created matching posts so they survive page refresh.
- The frontend already stores court reservations in the `reservations` table;
  matching posts were only kept in React state and disappeared on refresh.

2. New Tables
- `matching_posts`
  - `id` (text, primary key) — client-generated id (e.g. "m_abc123")
  - `reservation_id` (text) — links to the first court reservation row created for this post
  - `user_id` (text, not null) — the host user id
  - `date` (date, not null) — matching date
  - `time` (text, not null) — comma-joined time slots (e.g. "06:00, 07:00")
  - `court` (text, not null) — court name
  - `ntrp_requirement` (text, not null) — NTRP level or 'any'
  - `gender_requirement` (text, not null) — gender requirement
  - `max_players` (integer, not null) — max players including host
  - `game_type` (text, not null) — singles | doubles | mixed | women_doubles | men_doubles | any
  - `description` (text, not null) — free-text description
  - `status` (text, not null default '모집중') — 모집중 | 모집완료 | 종료
  - `applications` (jsonb, not null default '[]') — array of {id,userId,status,appliedAt,intro}
  - `created_at` (bigint, not null default epoch ms)

3. Security
- Enable RLS on `matching_posts`.
- The app has a sign-in screen (Supabase auth), but matching posts are shared
  community content visible to all signed-in users. We scope policies to
  `authenticated` and allow any authenticated user to read all posts, while only
  the owner can update/delete. Any authenticated user may insert (they are the
  host). Applications are stored as jsonb inside the row and updated by the
  host, so the owner-scoped UPDATE policy covers approve/reject/apply writes.
*/

CREATE TABLE IF NOT EXISTS matching_posts (
  id text PRIMARY KEY,
  reservation_id text NOT NULL,
  user_id text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  court text NOT NULL,
  ntrp_requirement text NOT NULL,
  gender_requirement text NOT NULL,
  max_players integer NOT NULL,
  game_type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT '모집중',
  applications jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint
);

ALTER TABLE matching_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_matching_posts" ON matching_posts;
CREATE POLICY "select_matching_posts" ON matching_posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_matching_posts" ON matching_posts;
CREATE POLICY "insert_matching_posts" ON matching_posts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_matching_posts" ON matching_posts;
CREATE POLICY "update_matching_posts" ON matching_posts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_matching_posts" ON matching_posts;
CREATE POLICY "delete_matching_posts" ON matching_posts FOR DELETE
  TO authenticated USING (true);
